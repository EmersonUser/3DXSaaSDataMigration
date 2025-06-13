import axiosInstance from "../auth/config.js";

/**
 * Helper function to create the request headers with JSESSIONID and CSRF token.
 * @param {string} cookie - The JSESSIONID to be used in headers.
 * @param {string} csrfToken - The CSRF token to be included in the request.
 * @param {string} securityContext - Security context for the request.
 * @returns {Object} - The headers object.
 */
const createHeaders = (cookie, csrfToken, securityContext) => {
  return {
    SecurityContext: securityContext,
    ENO_CSRF_TOKEN: csrfToken,
    "Content-Type": "application/json",
    Cookie: cookie,
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
    timeout: 3600000,
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

// Service for individual searching
export const searchProduct = async (req, item) => {
  try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      if (!item["Parent Name"] && !item["Child Name"] && !item["Parent Rev"] && !item["Child Rev"]) {
        return { status: "Missing required data" };
      }

      if (!item["Parent Name"] || !item["Child Name"]) {
        return { status: "Missing Parent Name/Child Name" };
      }

      if (!item["Parent Rev"] || !item["Child Rev"]) {
        return { status: "Missing Parent Rev/Child Rev" };
      }

      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
      const parentSearchUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/search?$searchStr=${encodeURIComponent(
        item["Parent Name"])}+revision=${item["Parent Rev"]}`;

      const childSearchUrl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/search?$searchStr=${encodeURIComponent(
        item["Child Name"])}+revision=${item["Child Rev"]}`;

      const parentSearchResponse = await makeApiRequest("get", parentSearchUrl, headers);
      const childSearchResponse = await makeApiRequest("get", childSearchUrl, headers);

      const parentNotFound = parentSearchResponse.totalItems === 0 || parentSearchResponse.member.length === 0;
      const childNotFound = childSearchResponse.totalItems === 0 || childSearchResponse.member.length === 0;

      if (parentNotFound || childNotFound) {
        return { status: "Parent Product/Child Product not found" };
      }

      const combinedData = { parent: parentSearchResponse?.member?.[0], child : childSearchResponse?.member?.[0]}
      return { data: combinedData};
    } catch (error) {
      console.error("Error searching product:", error);
      return { status: "Error while searching product" };
    }
};

// Service for checking if parent and child is connected
export const checkParentClassification = async (req, parentId, parentType) => {
    try {
        const cookie = req?.Cookie;
        const csrf = req?.ENO_CSRF_TOKEN;

        if (!cookie) throw new Error("Missing or invalid cookie.");
        if (!csrf) throw new Error("Missing CSRF token.");

        const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
        const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem/${parentId}?$mask=dslib:ReverseClassificationMask`;

        const classificationResponse = await makeApiRequest("get", url, headers);

        if (!classificationResponse || !classificationResponse.member || classificationResponse.totalItems === 0) {
            return { status: "No classification found" };
        }

        // Extract only the first ParentClassification member title
        const firstTitle = classificationResponse.member[0]?.ParentClassification?.member?.[0]?.title || null;

        if (!firstTitle) {
            return { status: "No classification title found" };
        }

        if (firstTitle === parentType) {
            return { status: "Classification Matched" };
        } else {
            return { status: "Classification Not Matched" };
        }
    } catch (error) {
        console.error("Error checking parent classification:", error);
        return { status: "Error while checking classification" };
    }
};
// Service for checking if parent and child is connected
export const extractChildConnections = async (req, parentId, childId) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

        const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
        const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${parentId}/dsmfg:MfgItemInstance?$mask=dsmfg:MfgItemInstanceMask.Details`;
        const childConnections = await makeApiRequest("get", url, headers);

        if (!childConnections || Object.keys(childConnections).length === 0 || !childConnections.member || childConnections.totalItems === 0) {
            return { status: "No child connected to this parent", isChildConnected: false };
        }
        // Check if childId is already connected
        const isChildConnected = childConnections.member.some(
            (child) => child.referencedObject?.identifier === childId
        );

        return { 
            status: isChildConnected ? "Child already connected with parent" : "No matching child connected", 
            isChildConnected 
        };

    } catch (error) {
        console.error(`Error fetching child connections for parentId: ${parentId}`, error);
        return { status: "Error while checking child connections", isChildConnected: false };
    }
};

// Service for creating MBOM connection
export const createMfgInstance = async (req, parentId, childId) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      const headers = createHeaders(cookie, csrf, "VPLMAdmin.Company%20Name.Default");
  
      const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${parentId}/dsmfg:MfgItemInstance`;
      const requestBody = {
        instances: [
          {
            referencedObject: {
              source: "https://OI000186152-us1-space.3dexperience.3ds.com/enovia",
              type: "CreateAssembly",
              identifier: childId,
              relativePath: `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${childId}`
            }
          }
        ]
      };
  
      // Make API request
      const response = await makeApiRequest("post", url, headers, JSON.stringify(requestBody));

      // Extract status and response data
      if (response) {
        return { status: "Manufacuturing instance created successfully", data: response };
      } else {
        return { status: "Failed to create Manufacuturing instance", error: response };
      }
    } catch (error) {
      console.error("Error creating Manufacuturing instance:", error);
      return { status: "An error occurred while creating Manufacuturing instance", error: error.message };
    }
};

export const updateMfgInstance = async (req, parentId, instanceData, updateData) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;
  
      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");
  
      const headers = createHeaders(cookie, csrf, "VPLMAdmin.Company%20Name.Default");
      const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${parentId}/dsmfg:MfgItemInstance/${instanceData.id}?$fields=dsmveno:CustomerAttributes`;
  
      // Creating request body dynamically based on the input data
      const requestBody = {
        name: String(updateData['Instance Title']),
        description: instanceData.description,
        cestamp: instanceData.cestamp,
        customerAttributes: {
          MBOMAttributes__b0e36f7ffa8f4e42b8be46904dad3047: {
            MBOMFindNumber__e7ead0d4e78a4d7f99e9e5fd900f8fdf: String(updateData['Find Number']),
            MBOMReferenceDesignator__41ecae64715b4acab306e1aa49f6571e: String(updateData['Reference Designator']),
            MBOMComponentLocation__00cc2e44830642d69dd3728d8c279a75: String(updateData['Component Location']),
            MBOMNotes__05e2b0f604cc4206821b10701eb2d773: String(updateData['Notes']),
            MBOMQuantity__03475a78ebac4d60976225cf73dbb4c0: String(updateData['Quantity'])
          }
        }
      };

      // Making the PATCH API request
      const response = await makeApiRequest("patch", url, headers, JSON.stringify(requestBody));
  
      if (response) {
        return { status: "Manufacuturing instance updated successfully", data: response };
      } else {
        return { status: "Failed to update Manufacuturing instance" };
      }
    } catch (error) {
      console.error("Error updating Manufacuturing instance:", error);
      return { status: "Error while updating Manufacuturing instance" };
    }
};
  