import path from "path";
import axios from "axios";
import axiosRetry from "axios-retry";
import { getCheckInTicketDocument, searchDocument } from "../service/index.js";

export function setupAxiosRetry() {
  axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
      console.warn(`🔁 Retrying... attempt ${retryCount}`);
      return retryCount * 1000;
    },
    retryCondition: (error) =>
      axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error),
  });
}

// 🔍 Process titles with throttling
export async function processTitlesWithThrottling(
  req,
  titles,
  limit,
  authData
) {
  const tasks = titles.map(({ title, part }, index) =>
    limit(() => makeSearchRequest(authData, title, part, index))
  );
  const results = await Promise.all(tasks);
  console.log("🎉 All search requests completed.");
  return results;
}

// 🔍 Make individual search request
export async function makeSearchRequest(authData, title, part, index) {
  try {
    const response = await searchDocument(authData.authData, title, part);
    const data = response?.searchResponse?.data;

    if (Array.isArray(data) && data.length > 0) {
      console.log(`✅ [${index + 1}] Found data for title: ${title}`);
      return {
        title,
        exists: Number(response?.searchResponse?.items) > 0,
        searchData: data[0],
        productData: response?.productData?.[0],
      };
    }

    return { title, exists: false };
  } catch (error) {
    console.error(
      `❌ [${index + 1}] Failed for title: ${title}`,
      error.message
    );
    return {};
  }
}

// 🧹 Parse search results
export function parseSearchResults(results) {
  const existentTitles = [];
  const nonExistentTitles = [];
  const collectiveSearchData = [];
  const productSearchData = [];

  results?.forEach((entry) => {
    if (entry?.exists) {
      existentTitles.push(entry.title);
      if (entry.searchData) collectiveSearchData.push(entry.searchData);
      if (entry.productData) productSearchData.push(entry.productData);
    } else if (entry?.title) {
      nonExistentTitles.push(entry.title);
    }
  });

  return {
    existentTitles,
    nonExistentTitles,
    collectiveSearchData,
    productSearchData,
  };
}

// 🎫 Generate check-in ticket tokens
export async function getTicketTokens(jsonData, files, authData) {
  return Promise.all(
    jsonData?.map(async (item) => {
      const filePath = item["File Path"];
      const fileName = filePath?.match(/[^\\]+$/)[0];
      const originalFile = files.find((f) => f.originalname === fileName);

      const response = await getCheckInTicketDocument(
        authData.authData,
        originalFile
      );

      return {
        checkinResponse: response?.CheckinFile?.trim(),
        originalFile,
      };
    })
  );
}

export const exceltoJsonConversion = async (req, res) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const filePath = req.file.path; // Path to the uploaded file

  try {
    // Ensure that the file is an Excel file by checking its extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== ".xlsx" && ext !== ".xls") {
      return res.status(400).json({
        error: "Invalid file type. Only .xlsx or .xls files are allowed.",
      });
    }

    // Read the Excel file using the excelService
    const jsonData = await readExcelFile(filePath);

    // Send the JSON response
    res.status(200).json({ jsonData, message: "JSON conversion sucessful" });
  } catch (error) {
    res.status(500).json({ error: "Failed to process the Excel file" });
  }
};

export const flattenJSON = (data) => {
  const result = [];
  data.forEach((item) => {
    const base = {
      id: item.id,
      type: item.type,
      name: item.dataelements?.name,
      state: item.dataelements?.state,
      title: item.dataelements?.title,
      description: item.dataelements.description,
    };

    item.relateddata.files.forEach((file) => {
      result.push({
        ...base,
        fileTitle: file.dataelements?.title,
        fileName: file.dataelements?.name,
        fileSize: file.dataelements.fileSize,
      });
    });
  });
  return result;
};

export const categorizeTitlesAndParts = (jsonData) => {
  return jsonData?.reduce(
    (acc, item) => {
      const entry = {
        title: item?.Title,
        part: item?.["Part Details"],
      };

      if (item?.custom_Type === "custom") {
        acc.titlesAndPartDetailsCustomType.push(entry); // Add to customType if it's "custom"
      } else {
        acc.titlesAndPartDetails.push(entry); // Add to current otherwise
      }

      return acc;
    },
    { titlesAndPartDetails: [], titlesAndPartDetailsCustomType: [] } // Initialize with empty arrays
  );
};

export const chunkArray = (array, chunkSize) => {
  return array.reduce((chunks, _, index) => {
    if (index % chunkSize === 0) {
      chunks.push(array.slice(index, index + chunkSize));
    }
    return chunks;
  }, []);
};
