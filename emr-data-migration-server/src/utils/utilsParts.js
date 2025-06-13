import multer from "multer";
import {
  searchProduct,
  reviseProduct,
  promateState,
  promatecustomState,
} from "../service/products.service.js";
import axios from "axios";
import https from "https";
import xlsx from "xlsx";
import axiosInstance from "../auth/config.js";
// Multer configuration for file uploads
export const upload = multer({ dest: "/upload" });

/**
 * Helper function to check authentication data.
 * @param {Object} authData - The authentication data.
 * @throws {Error} - Throws an error if authentication data is invalid.
 */
export const isAuthenticated = (authData) => {
  if (!authData) {
    throw new Error("Authentication data is missing");
  }
};

/**
 * Promisify the file upload process.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise} - Resolves with the uploaded file or rejects with an error.
 */
export const uploadFile = (req, res) => {
  return new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        reject(new Error("File upload failed"));
      } else if (!req.file) {
        reject(new Error("No file uploaded"));
      } else {
        resolve(req.file);
      }
    });
  });
};

/**
 * Promisify the file upload process.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise} - Resolves with the uploaded file or rejects with an error.
 */
export const multipleUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    upload.array("files")(req, res, (err) => {
      if (err) {
        reject(new Error("File uploading failed"));
      } else if (!req.files || req.files.length === 0) {
        reject(new Error("No files uploaded"));
      } else {
        resolve(req.files);
      }
    });
  });
};

/**
 * Convert Excel file to JSON.
 * @param {string} filePath - Path to the Excel file.
 * @returns {Promise<Array>} - Resolves with JSON data extracted from the file.
 */
export const readExcelFile = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Get the first sheet
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
};

/**
 * Format unmatched items for product creation.
 * @param {Array} unmatched - Array of unmatched product items.
 * @returns {Object} - Formatted object with required attributes for unmatched items.
 */
export const formatUnmatchedItems = (unmatched) => {
  // return;
  const createdres = {
    items: unmatched?.map((item) => ({
      attributes: {
        title: item.Title,
        isManufacturable: true, // Assuming this is a constant value
        description: item.Description,
        "dseno:EnterpriseAttributes": {
          EMR_ERP_LongDescription: item["Long Description"],
          EMR_ERP_PrimaryUOM: item["Unit of Measure"],
          // Comments: item.Comments,
        },
        "dseng:EnterpriseReference": {
          partNumber: item.Name,
        },
      },
    })),
  };
  return createdres;
};
// );

/**
 * Search products by iterating through the JSON data.
 * @param {Object} req - The request object.
 * @returns {Object} - Contains matched and unmatched products.
 */
export const searchProducts = async (req, authData) => {
  const { jsonData } = req;
  const matched = [];
  const ErrorParts = [];
  try {
    // Call searchProduct for each item (make sure to await it)
    const { searchedData, customValue, unmatched, customSearchedData } =
      await searchProduct(req, authData); // Pass req to searchProduct
    console.log(searchedData, "searchedData");
    searchedData?.map((res, key) => {
      if (res?.totalItems >= 1) {
        const indexVal = res?.member;
        const highestRelase = filterHighestState(indexVal);
        const checkError = checkSearchError(jsonData, highestRelase);
        ErrorParts.push(checkError);
        if (checkError.length == 0) {
          matched.push(highestRelase);
        }
      } else {
        ErrorParts.push("Invalid");
      }
    });
    return { matched, unmatched, customValue, customSearchedData };
  } catch (error) {
    ErrorParts.push("facing issue with searchWs");
    console.error(`Error searching for product with title":`, error);
  }
};
export const checkSearchError = (val, arr) => {
  let ErrorMsg = [];
  for (let i = 0; i < arr.length; i++) {
    // Check if the title matches
    if (val.title === arr[i]["Title"]) {
      // Check if the revision is less than or equal to the current item's revision
      if (val.revision < arr[i]["Rev"]) {
        ErrorMsg.push({
          id: arr[i]["Title"],
          message: `${arr[i]["Title"]} Given revision is greater than Search Revision`,
        }); // Add the title to the error messages
      }
    }
  }
  return ErrorMsg;
};
export const filterHighestState = (array) => {
  return array.reduce((highest, current) => {
    // If highest is null or current revision is greater, return current
    return !highest || current.revision > highest.revision ? current : highest;
  }, null);
};

// If no "RELEASED" state is found, check for "IN_WORK" state

/**
 * Revise products by using the reviseProduct service.
 * @param {Object} authData - The authentication data.
 * @returns {Promise<Object>} - Response from the reviseProduct service.
 */
export const revisedProjects = async (req) => {
  try {
    // Ensure authentication data is valid
    const results = await reviseProduct(req);
    console.log("RevisedRes", results, "RevisedRes");
    return {
      message: "revise products sucessful",
      results: results,
    };
  } catch (error) {
    return {
      error: "An error occurred while revising the products.",
      message: "revised not required",
    };
  }
};

export const createPromateParam = async (promateObj) => {
  const ids = [];

  // Check if results array exists in promateObj
  if (promateObj && promateObj?.results && promateObj?.results.results) {
    // Loop through each result and extract the id
    promateObj.results.results.forEach((item) => {
      // Push the id to the ids array
      const id = item.id; // Directly access the id
      if (id) {
        ids.push(id);
      }
    });
  }

  return ids; // Return the array of ids
};
export const createReviseParam = async (data) => {
  const ids = data?.map((item) => item.id); // Extract IDs
  return ids;
};
/**
 * promate products by using the promateObject service.
 * @param {Object} authData - The authentication data.
 * @returns {Promise<Object>} - Response from the reviseProduct service.
 */
export const promateObjects = async (req) => {
  try {
    let results = [];

    try {
      results = await promateState(req);
    } catch (error) {
      console.error(`Error promoting product with ID }:`, error.message);
      results.push({ productId: results, error: error.message }); // Store error details
    }
    // }

    // Return the results after processing all products
    return {
      message: "Products processed successfully",
      results,
    };
  } catch (error) {
    // General error handling for the entire process
    console.error("Error in promateObjects:", error.message);
    throw new Error("Error processing products: " + error.message);
  }
};
export const promatecustomObjects = async (req) => {
  try {
    let results = [];

    try {
      results = await promatecustomState(req);
    } catch (error) {
      console.error(`Error promoting product with ID }:`, error.message);
      results.push({ productId: results, error: error.message }); // Store error details
    }
    // }

    // Return the results after processing all products
    return {
      message: "Products processed successfully",
      results,
    };
  } catch (error) {
    // General error handling for the entire process
    console.error("Error in promateObjects:", error.message);
    throw new Error("Error processing products: " + error.message);
  }
};
export const findIdByTitle = (membersArray, targetTitle) => {
  for (const obj of membersArray) {
    if (obj.title === targetTitle) {
      return obj.id; // Return ID if title matches
    }

    if (obj.ChildClasses && obj.ChildClasses.member) {
      const result = findIdByTitle(obj.ChildClasses.member, targetTitle);
      if (result) return result; // Return the ID once found
    }
  }
  return null; // Return null if not found
};
export const promateRevise = async (matched) => {
  const data = matched
    .filter((item) => item.state !== "RELEASED") // Filter out items with state "RELEASED"
    .map((item) => ({
      id: item.id,
      nextState: "RELEASED",
    }));
  return { data };
};
export const revisedItem = async (req) => {
  const { jsonData, matched } = req;
  // Iterate through jsonData and match with matched array
  const promateScenerion = [];
  const revisionScenerion = [];

  // Iterate through jsonData and match with matched array
  jsonData.forEach((inputItem) => {
    // Find matching item in matched array by title
    const matchedItem = matched?.find(
      (m) => m.title.toLowerCase() === inputItem.Title.toLowerCase()
    );

    // If a matching item is found
    if (matchedItem) {
      // Compare revisions
      if (matchedItem?.state == "IN_WORK") {
        // If input revision is higher, add to promateScenerion
        promateScenerion.push(matchedItem);
      } else {
        // If input revision is lower, add to revisionScenerion
        revisionScenerion.push(matchedItem);
      }
    }
  });
  return { promateScenerion, revisionScenerion };
};
export const makeApiRequest = async ({ method, url, headers, data = null }) => {
  const config = {
    method,
    maxBodyLength: Infinity,
    url,
    headers,
    data,
  };

  try {
    const response = await axiosInstance.request(config);
    return response.data;
  } catch (error) {
    console.error(`Error during ${method} request to ${url}:`, error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      console.error("Request data:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    throw new Error(`Error during ${method} request: ${error.message}`);
  }
};
// Utility function to remove circular references
export const removeCircularReferences = async (obj) => {
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    })
  );
};
const makeAllIds = (index, ids) => ids[index]; // Concise arrow function

export const formatIds = (ids, jsonData) => ({
  data: jsonData.map((item, index) => ({
    physicalid: makeAllIds(index, ids), // Call makeAllIds with the index
    modifiedAttributes: {
      revision: item.Rev, // Access the revision from jsonData
    },
    proposedRevision: item.Rev, // Use the same revision for proposedRevision
  })),
  folderid: null,
  notificationTimeout: 600,
  metrics: {
    UXName: "Revise",
    client_app_domain: "3DEXPERIENCE 3DDashboard",
    client_app_name: "ENXENG_AP",
  },
});

export const parsePipeSeparatedData = (inputStr) => {
  const items = inputStr.split("|");

  const result = items.map((item) => {
    const [type, title, revision] = item.split(",");
    return { type, title, revision };
  });

  return result;
};

const productCache = new Map(); // Cache object for product API responses

export const searchProductsWithRevision = async (parsedParts, req) => {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    // Use Promise.all to handle asynchronous requests for all parsedParts
    const searchResults = await Promise.all(
      parsedParts.map(async ({ title, revision }) => {
        // Generate a unique cache key for each title and revision
        const cacheKey = `${title}_${revision}`;

        // Check if the result is already in the cache
        if (productCache.has(cacheKey)) {
          console.log(`🛑 Cache hit for product: ${cacheKey}`);
          return productCache.get(cacheKey); // Return cached result
        }

        console.log(`🔍 Cache miss for product: ${cacheKey}. Fetching from API...`);

        // Update only the URL for each request
        const config = {
          method: "get",
          maxBodyLength: Infinity,
          headers: {
            SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
            ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
            Cookie: req?.Cookie,
            "Content-Type": "application/json",
            "Content-Type": req["Content-Type"],
          },
          url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=${encodeURIComponent(
            title
          )}+revision=${encodeURIComponent(revision)}`,
          timeout: 150000,
        };

        try {
          const productResponse = await axios.get(`${config.url}`, {
            params: {
              searchStr: title,
            },
            headers: config.headers,
            httpsAgent: agent,
          });

          if (productResponse?.status !== 200) {
            throw new Error(
              `Error fetching product with title ${title}: ${productResponse.statusText}`
            );
          }

          // Process the response as needed
          let result;
          if (productResponse?.data?.totalItems === 0) {
            result = {
              message: `Parts don't exist for ${title} with ${revision}`,
              totalItems: 0,
            };
          } else if (productResponse?.data?.totalItems > 0) {
            result = {
              message: `Parts found for ${title} with ${revision}`,
              totalItems: productResponse?.data?.totalItems,
              member: productResponse.data?.member
                ? productResponse?.data?.member
                : null,
            };
          }

          // Store the result in the cache
          productCache.set(cacheKey, result);
          return result;
        } catch (error) {
          console.error(`Error fetching product for ${title}:`, error.message);
          throw error;
        }
      })
    );

    return searchResults;
  } catch (error) {
    console.error("Error searching for products:", error);
    throw error;
  }
};
