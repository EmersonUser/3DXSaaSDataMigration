import axiosInstance from "../auth/config.js";
import xlsx from "xlsx";
import { formatIds, filterHighestState } from "../utils/utilsParts.js";

/**
 * Helper function to create the request headers with JSESSIONID and CSRF token.
 * @param {string} jsessionid - The JSESSIONID to be used in headers.
 * @param {string} csrfToken - The CSRF token to be included in the request.
 * @param {string} securityContext - Security context for the request.
 * @returns {Object} - The headers object.
 */
const createHeaders = ({ Cookie, ENO_CSRF_TOKEN, SecurityContext }) => {
  return {
    SecurityContext: SecurityContext,
    ENO_CSRF_TOKEN: ENO_CSRF_TOKEN,
    "Content-Type": "application/json",
    Cookie: Cookie,
  };
};
const createModifiedHeaders = ({ Cookie, ENO_CSRF_TOKEN }) => {
  return {
    SecurityContext: "VPLMAdmin.Company%20Name.Default",
    ENO_CSRF_TOKEN: ENO_CSRF_TOKEN,
    "Content-Type": "application/json",
    Cookie: Cookie,
  };
};
/**
 * Generic function to make API requests.
 * @param {string} method - The HTTP method (e.g., 'get', 'post').
 * @param {string} url - The URL to which the request will be sent.
 * @param {Object} headers - The headers to include in the request.
 * @param {Object|string} data - The data to send with the request (for POST).
 * @returns {Object} - The response data from the API.
 */
const makeApiRequest = async (method, url, headers, data = null) => {
  const config = {
    method,
    maxBodyLength: Infinity,
    url,
    headers,
    data,
    timeout: 150000,
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
  }
};

// Service for searching products
export const searchProduct = async (req) => {
  const searchedData = [];
  const customValue = [];
  const matched = [];
  const unmatched = [];
  const { jsonData } = req;
  const customSearchedData = [];

  await Promise.all(
    jsonData.map(async (res) => {
      if (res?.Custom === "custom") {
        customValue.push(res);
        const headers = createHeaders(req.authData);
        const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=${encodeURIComponent(
          res.Title
        )}&$mask=dsmveng:EngItemMask.Details`;
        const result = await makeApiRequest("get", url, headers);
        customSearchedData?.push(result?.member);
      } else {
        const headers = createHeaders(req.authData);
        const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=${encodeURIComponent(
          res.Title
        )}&$mask=dsmveng:EngItemMask.Details`;
        console.log("get", url, headers);
        const result = await makeApiRequest("get", url, headers);

        if (result?.totalItems == 0) {
          unmatched.push(res);
        } else {
          searchedData.push(result);
        }
      }
    })
  );
  return { searchedData, customValue, customSearchedData, unmatched };
};
export const findLibraryId = async (req, res) => {
  try {
    // Retrieve JSESSIONID and CSRF token from request

    // Prepare headers for API request
    const headers = createHeaders(req.authData);
    const headerformodify = createModifiedHeaders(req.authData);

    // URL to search for library
    const url =
      "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:Library/search?$searchStr=OLD_Micro Motion";

    // Get the library search result
    const searchbyLibraryIds = await makeApiRequest("get", url, headers);
    let allClassdatawithIds = null;
    // Filter libraries based on the title "Fastener"
    const filteredLibraries = searchbyLibraryIds?.member?.filter(
      (item) => item.title === "OLD_Micro Motion"
    );
    // If no libraries found with title "Fastener"
    // If there's only one filtered library, call API directly
    if (filteredLibraries.length === 1) {
      const item = filteredLibraries[0]; // Only one item
      const classUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:Library/${item.id}?$mask=dslib:ExpandClassesDetailsMask`;

      try {
        const classSearchResult = await makeApiRequest(
          "get",
          classUrl,
          headers
        );
        let searchbyClassIds = [classSearchResult]; // Wrap it in an array for consistency
        allClassdatawithIds = await flattenClasses(searchbyClassIds);
        const ClassIDwithFastener = allClassdatawithIds
          .filter((filteredval) => {
            if (filteredval.title === "Fastener") {
              return true;
            }
          })
          .map((filteredval) => filteredval.id);
        //this API is not required for revised scenerio (i.e matchedData)
        const classDetialsUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem`;
        const { addProducts } = req;
        const classDetialsResult = []; // Initialize the result array
        const searcedClassifiedResult = [];
        let updateClassifiedresults = [];
        await Promise.all(
          addProducts.map(async (res) => {
            const classDetialspayload = {
              ClassID: ClassIDwithFastener.toString(),
              ObjectsToClassify: [
                {
                  source:
                    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
                  type: "VPMReference",
                  identifier: `${res.id}`,
                  relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${res.id}`,
                },
              ],
            };

            // Make API request to classify the item
            const classDetialResult = await makeApiRequest(
              "post",
              classDetialsUrl,
              headers,
              classDetialspayload
            );

            // Construct dynamic search URL
            const dynamicSearchUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem/${res.id}`;
            const searchClassifiedItem = await makeApiRequest(
              "get",
              dynamicSearchUrl,
              headers
            );

            // Push results into respective arrays
            searcedClassifiedResult.push(searchClassifiedItem);
            classDetialsResult.push(classDetialResult);
          })
        );

        // Prepare to update classified items
        const updateClassifiedUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem/modify`;
        const updateClassifiedpayload =
          await createPayloadforUpdateClassifiedPart(searcedClassifiedResult);
        // Make API request to update classified items
        const updateClassifiedresult = await makeApiRequest(
          "post",
          updateClassifiedUrl,
          headerformodify,
          updateClassifiedpayload
        );
        updateClassifiedresults.push(updateClassifiedresult);
        // Return the results
        return {
          findlibraryIdsWS: filteredLibraries,
          libraryDetialsWS: allClassdatawithIds,
          getClassDetialsWS: classDetialsResult,
          classifiedItemsWS: searcedClassifiedResult,
          updateclassifiedItemsWS: updateClassifiedresults,
        };
      } catch (error) {
        console.error(
          `Error fetching class details for ${item.id}:`,
          error.message
        );
      }
    } else {
      // If there are multiple filtered libraries, process them concurrently using map
      const searchbyClassIdsPromises = filteredLibraries.map(async (item) => {
        const classUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:Library/${item.id}?$mask=dslib:ExpandClassesDetailsMask`;

        try {
          const classSearchResult = await makeApiRequest(
            "get",
            classUrl,
            headers
          );
          return classSearchResult;
        } catch (error) {
          console.error(
            `Error fetching class details for ${item.id}:`,
            error.message
          );
          return { error: error.message, id: item.id };
        }
      });
      // Wait for all class search results concurrently
      const searchbyClassIds = await Promise.all(searchbyClassIdsPromises);
      allClassdatawithIds = flattenClasses(searchbyClassIds);

      // Return both the library and class search results
      return {
        searchbyLibraryIds: filteredLibraries,
        searchbyClassIds: allClassdatawithIds,
      };
    }
  } catch (error) {
    return { msg: "facing issue with searchbyIds" };
  }
};

// Service for reading an Excel file
export const readExcelFile = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
};
const createPayloadforUpdateClassifiedPart = async (items) => {
  return items.flatMap((item) =>
    item.member.map((member) => ({
      referencedObject: {
        source: "https://OI000186152-us1-space.3dexperience.3ds.com/enovia",
        type: "dslib:ClassifiedItem",
        identifier: member.id, // Use member.id for the identifier
        relativePath: `resources/v1/modeler/dslib/dslib:ClassifiedItem/${member.id}`,
      },
      attributes: {
        cestamp: member.cestamp, // Use member.cestamp for the cestamp
        EMRDrawingRequired: member.EMRDrawingRequired || "No", // Default to "No" if not provided
        EMRFirstArticleRequired: member.EMRFirstArticleRequired || "No", // Default to "No" if not provided
        EMRRoHSCompliant: member.EMRRoHSCompliant || "No", // Default to "No" if not provided
      },
    }))
  );
};

// Service for creating a product
export const createProduct = async (req, res) => {
  const headers = createHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem";
  return await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(req.createReqData)
  );
};
export const createcustomProduct = async (req, res) => {
  const headers = createHeaders(req.authData);
  console.log(JSON.stringify(req.createcustomReqData), "reqreatecustomReqData");
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem";
  return await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(req.createcustomReqData)
  );
};

// Service for revising a product
export const reviseProduct = async (req, res) => {
  const { ids, jsonData, matched } = req;
  const allPhysicalProd = [];
  const updatedPhysicalProd = [];
  const headers = createHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/lifecycle/revise/major?tenant=OI000186152&xrequestedwith=xmlhttprequest";
  console.log(ids, matched);
  const data = formatIds(ids, matched);
  console.log("Request for Revise", JSON.stringify(data));
  let reviseResult = await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(data)
  );
  console.log("response for reviseProduct", reviseResult);
  await Promise.all(
    reviseResult?.results?.map(async (item, index) => {
      const headers = createHeaders(req.authData);
      const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/${encodeURIComponent(
        item.physicalid
      )}?$mask=dsmveng:EngItemMask.Details`;
      const GetphysicalResult = await makeApiRequest("get", url, headers);
      allPhysicalProd.push({
        cestamp: GetphysicalResult?.member[0]?.cestamp,
        physicalId: item.physicalid,
      });
    })
  );
  await Promise.all(
    allPhysicalProd?.map(async (item, index) => {
      const headers = createHeaders(req.authData);
      const updatephysicalProductUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/${encodeURIComponent(
        item?.physicalId
      )}`;
      const updateReqParam = {
        description: "My description",
        cestamp: item?.cestamp,
        isManufacturable: true,
        "dseno:EnterpriseAttributes": {
          EMR_ERP_LongDescription: "Test",
          EMR_ERP_PrimaryUOM: "Each",
        },
      };
      const updatePhysicalProducts = await makeApiRequest(
        "patch",
        updatephysicalProductUrl,
        headers,
        updateReqParam
      );
      updatedPhysicalProd.push(updatePhysicalProducts);
    })
  );
  return reviseResult;
};
// Service for revising a product
export const revisecustomProduct = async (req, res) => {
  const { customValue, addcustomProducts } = req;
  const ids = addcustomProducts?.map((res) => res.id);
  const headers = createModifiedHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/lifecycle/revise/major?tenant=OI000186152&xrequestedwith=xmlhttprequest";
  const data = formatIds(ids, customValue);
  console.log("Request for Revise", ids, JSON.stringify(data));
  let reviseResult = await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(data)
  );
  console.log("response for custom reviseProduct", reviseResult);
  return reviseResult;
};
//get physical products
export const formatcustomRevise = (ids) => {
  console.log(ids, "AllIds");
  const data = ids.map((res, index) => ({
    identifier: res,
    relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${res}`,
    id: res,
    source: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
    type: "VPMReference",
  }));

  return {
    edgeType: "Revision",
    data,
  };
};
export const deleteOldProducts = async (req, res) => {
  const DeleteRes = [];
  console.log("its running now delete", req?.customSearchedData);
  const headers = createModifiedHeaders(req.authData);
  req?.revisecustomProducts?.results?.map(async (res) => {
    const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/${encodeURIComponent(
      res.versionid
    )}`;

    const result = await makeApiRequest("delete", url, headers);
    console.log("Deleeted URL>>>>", url, result);
    DeleteRes.push(result);
  });

  return DeleteRes;
};
// Service for promoting a product's state
export const promateState = async (req, res) => {
  const { id, addProducts } = req;
  const headers = createModifiedHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState";
  const data = createJsonPromated(addProducts);
  console.log("Payload for Promate");
  return await makeApiRequest("post", url, headers, data);
};
export const promatecustomState = async (req, res) => {
  const { id } = req;
  console.log(req?.addcustomProducts, "addcustomProductsaddcustomProducts");
  const headers = createModifiedHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState";
  const data = createJsonPromated(req?.addcustomProducts);
  console.log("Payload for custom Promate", data);
  return await makeApiRequest("post", url, headers, data);
};
export const promateUnmatchedState = async (req, res) => {
  const headers = createModifiedHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState";
  const data = creatematchedPromated(req?.revisematchedProducts?.results);
  console.log("payload for promate Revised>>", data);
  return await makeApiRequest("post", url, headers, data);
};
export const promatecustomrevisedState = async (req, res) => {
  const headers = createModifiedHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState";
  const data = creatematchedPromated(req?.revisecustomProducts?.results);
  console.log("payload next for custome promate", data);
  return await makeApiRequest("post", url, headers, data);
};
export const promotePromatedscenerio = async (req, res) => {
  const headers = createModifiedHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState";
  const data = createPromated(req.idss);
  console.log("payload next for custome promate", data);
  return await makeApiRequest("post", url, headers, data);
};
function createJsonPromated(data) {
  // Extract IDs using the map function
  console.log("Payload for promate", data);
  const ids = data?.map((item) => item.id);

  // Create the JSON structure
  const jsonData = {
    data: ids?.map((id) => ({
      id: id,
      nextState: "RELEASED",
    })),
  };

  return JSON.stringify(jsonData);
}
const createPromated = (ids) => {
  console.log("PROMATEDIDS>>>>>", ids);
  const jsonData = {
    data: ids?.map((id) => ({
      id: id,
      nextState: "RELEASED",
    })),
  };

  return jsonData;
};
const creatematchedPromated = (ids) => {
  const jsonData = {
    data: ids?.map((res) => ({
      id: res?.physicalid,
      nextState: "RELEASED",
    })),
  };

  return jsonData;
};

// Helper function for recursively processing each class and its children
const flattenClasses = async (data) => {
  const result = [];

  // Helper function for recursively processing each class and its children
  const processClass = (lib) => {
    // Add the current class/library data
    result.push({
      id: lib.id,
      name: lib.name,
      title: lib.title,
      classUsage: lib.libraryUsage || lib.classUsage,
      description: lib.description,
      type: lib.type,
      modified: lib.modified,
      created: lib.created,
      revision: lib.revision,
      state: lib.state,
      owner: lib.owner,
      organization: lib.organization,
      collabspace: lib.collabspace,
    });

    // Recursively process child classes if they exist
    if (lib.ChildClasses && lib.ChildClasses.member) {
      lib.ChildClasses.member.forEach((child) => {
        processClass(child); // Recursively process each child
      });
    }
  };

  // Loop through the searchbyClassIds and process each library
  data.forEach((item) => {
    item.member.forEach((lib) => {
      processClass(lib); // Process each library and its child classes
    });
  });

  return result;
};
export const findcustomLibraryId = async (req, res) => {
  try {
    // Retrieve JSESSIONID and CSRF token from request

    // Prepare headers for API request
    const headers = createHeaders(req.authData);
    const headerformodify = createModifiedHeaders(req.authData);

    // URL to search for library
    const url =
      "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:Library/search?$searchStr=OLD_Micro Motion";

    // Get the library search result
    const searchbyLibraryIds = await makeApiRequest("get", url, headers);
    let allClassdatawithIds = null;
    // Filter libraries based on the title "Fastener"
    const filteredLibraries = searchbyLibraryIds?.member?.filter(
      (item) => item.title === "OLD_Micro Motion"
    );
    // If no libraries found with title "Fastener"
    // If there's only one filtered library, call API directly
    if (filteredLibraries.length >= 1) {
      const item = filteredLibraries[0]; // Only one item
      const classUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:Library/${item.id}?$mask=dslib:ExpandClassesDetailsMask`;

      try {
        const classSearchResult = await makeApiRequest(
          "get",
          classUrl,
          headers
        );
        let searchbyClassIds = [classSearchResult]; // Wrap it in an array for consistency
        allClassdatawithIds = await flattenClasses(searchbyClassIds);
        const ClassIDwithFastener = allClassdatawithIds
          .filter((filteredval) => {
            if (filteredval.title === "Fastener") {
              return true;
            }
          })
          .map((filteredval) => filteredval.id);
        //this API is not required for revised scenerio (i.e matchedData)
        const classDetialsUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem`;
        const { revisecustomProducts } = req; //add here physicalid
        const classDetialsResult = []; // Initialize the result array
        const searcedClassifiedResult = [];
        let updateClassifiedresults = [];
        await Promise.all(
          revisecustomProducts.results.map(async (res) => {
            const classDetialspayload = {
              ClassID: ClassIDwithFastener.toString(),
              ObjectsToClassify: [
                {
                  source:
                    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
                  type: "VPMReference",
                  identifier: `${res.physicalid}`,
                  relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${res.physicalid}`,
                },
              ],
            };

            // Make API request to classify the item
            const classDetialResult = await makeApiRequest(
              "post",
              classDetialsUrl,
              headers,
              classDetialspayload
            );

            // Construct dynamic search URL
            const dynamicSearchUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem/${res.id}`;
            const searchClassifiedItem = await makeApiRequest(
              "get",
              dynamicSearchUrl,
              headers
            );

            // Push results into respective arrays
            searcedClassifiedResult.push(searchClassifiedItem);
            classDetialsResult.push(classDetialResult);
          })
        );

        // Prepare to update classified items
        const updateClassifiedUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem/modify`;
        const updateClassifiedpayload =
          await createPayloadforUpdateClassifiedPart(searcedClassifiedResult);
        // Make API request to update classified items
        const updateClassifiedresult = await makeApiRequest(
          "post",
          updateClassifiedUrl,
          headerformodify,
          updateClassifiedpayload
        );
        updateClassifiedresults.push(updateClassifiedresult);
        // Return the results
        return {
          findlibraryIdsWS: filteredLibraries,
          libraryDetialsWS: allClassdatawithIds,
          getClassDetialsWS: classDetialsResult,
          classifiedItemsWS: searcedClassifiedResult,
          updateclassifiedItemsWS: updateClassifiedresults,
        };
      } catch (error) {
        console.error(
          `Error fetching class details for ${item.id}:`,
          error.message
        );
      }
    } else {
      // If there are multiple filtered libraries, process them concurrently using map
      const searchbyClassIdsPromises = filteredLibraries.map(async (item) => {
        const classUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:Library/${item.id}?$mask=dslib:ExpandClassesDetailsMask`;

        try {
          const classSearchResult = await makeApiRequest(
            "get",
            classUrl,
            headers
          );
          return classSearchResult;
        } catch (error) {
          console.error(
            `Error fetching class details for ${item.id}:`,
            error.message
          );
          return { error: error.message, id: item.id };
        }
      });
      // Wait for all class search results concurrently
      const searchbyClassIds = await Promise.all(searchbyClassIdsPromises);
      allClassdatawithIds = flattenClasses(searchbyClassIds);

      // Return both the library and class search results
      return {
        searchbyLibraryIds: filteredLibraries,
        searchbyClassIds: allClassdatawithIds,
      };
    }
  } catch (error) {
    return { msg: "facing issue with searchbyIds" };
  }
};
