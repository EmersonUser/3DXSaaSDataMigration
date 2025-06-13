import axiosInstance from "../auth/config.js";

/**
 * Helper function to create the request headers with cookie and CSRF token.
 * @param {string} cookie - The cookie to be used in headers.
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
    return response.data ? response.data : response?.status;
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

const SOURCE_URL = "https://OI000186152-us1-space.3dexperience.3ds.com/enovia";

const appendCreateReqBody = (policy, type, same) =>{
    return {
        policy: policy,
        description: `Description of ${type}`,
        type: type,
        title: same,
        name: same,
        severity: "Low"
    }
};

const appendConstantKeys = (keyType, id, path) => {
    return {
        source: SOURCE_URL,
        type: keyType,
        identifier: id,
        relativePath: `/resources/v1/modeler/${path}/${id}`
    }
};

const appendProposedParts = (data, changeType) => {
    if (!data?.searchResults || !Array.isArray(data.searchResults)) return [];

    const filtered = data.searchResults.filter(item => item?.data?.id);

    switch (changeType) {
        case "CA":
            return filtered.map(item => ({
                where: appendConstantKeys("VPMReference", item.data.id, "dseng/dseng:EngItem"),
                target: "CurrentVersion",
                whats: [{ what: "Modify" }]
            }));
        case "route":
            return filtered.map(item => appendConstantKeys("Route Template", item.data.id, "dsrt/routetemplates"));
        case "affect":
            return filtered.map(item => appendConstantKeys("VPMReference", item.data.id, "dseng/dseng:EngItem"));
        default:
            console.warn(`Unknown changeType: ${changeType}`);
            return []; 
    }
};
  
// Service for individual searching
export const searchProduct = async (req, items) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;
  
      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");
  
      if (!items || items.length === 0) {
        return { status: "Missing or empty items data" };
      }
  
      const results = [];
  
      for (let item of items) {
        if (!item["Name"] && !item["Revision"] && !item["Type"]) {
          results.push({ status: "Missing required proposed data for item", item });
          continue;
        }
  
        if (!item["Name"]) {
          results.push({ status: "Missing Name for item", item });
          continue;
        }
  
        if (!item["Revision"]) {
          results.push({ status: "Missing Revision for item", item });
          continue;
        }
  
        const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
        const searchUrl = `${SOURCE_URL}/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=${encodeURIComponent(item["Name"])}+revision=${item["Revision"]}`;
  
        const searchResponse = await makeApiRequest("get", searchUrl, headers);
  
        const notFound = searchResponse.totalItems === 0 || searchResponse.member.length === 0;
  
        if (notFound) {
          results.push({ status: "Product could not be found" });
        } else {
          results.push( {data: searchResponse?.member?.[0]} );
        }
      }
  
      return { searchResults : results };
    } catch (error) {
      console.error("Error searching product:", error);
      return { status: "Error while searching product" };
    }
  };

// Service for creating Change Action
export const createChangeAction = async (req, CAname) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
      const url = `${SOURCE_URL}/resources/v1/modeler/dslc/changeaction`;
  
      const requestBody = appendCreateReqBody("Change Action", "Change Action", CAname);
  
      const response = await makeApiRequest("post", url, headers, JSON.stringify(requestBody));

      if (response) {
        return { status: "Change Action created", data: response };
      } else {
        return { status: "Failed to create Change Action" };
      }
    } catch (error) {
      console.error("Error creating Change Action:", error);
      return { status: "An error occurred while creating Change Action", error: error.message };
    }
};

// Service for creating Change Order
export const createChangeOrder = async (req, COname) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
      const url = `${SOURCE_URL}/resources/v1/modeler/dscm/changeorder`;
  
      const requestBody = appendCreateReqBody("Fast track Change", "Change Order", COname);
  
      const response = await makeApiRequest("post", url, headers, JSON.stringify(requestBody));

      if (response) {
        return { status: "Change Order created", data: response };
      } else {
        return { status: "Failed to create Change Order" };
      }
    } catch (error) {
      console.error("Error creating Change Order:", error);
      return { status: "An error occurred while creating Change Order", error: error.message };
    }
};

// Service for creating Change Request
export const createChangeRequest = async (req, CRname) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
      const url = `${SOURCE_URL}/resources/v1/modeler/dscm/changerequest`;
  
      const requestBody = appendCreateReqBody("Request For Change", "Change Request", CRname);
  
      const response = await makeApiRequest("post", url, headers, JSON.stringify(requestBody));

      if (response) {
        return { status: "Change Request created", data: response };
      } else {
        return { status: "Failed to create Change Request" };
      }
    } catch (error) {
      console.error("Error creating Change Request:", error);
      return { status: "An error occurred while creating Change Request", error: error.message };
    }
};

// Service for creating Impact Analysis
export const createImpactAnalysis = async (req, CRname, CRid) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
      const url = `${SOURCE_URL}/resources/v1/modeler/dscm/changerequest/${CRid}/impactanalysis`;
  
      const requestBody = {
        type: "Change Analysis",
        policy: "Change Analysis",
        description: "Description of Impact Analysis",
        title: `IA-${CRname}`
      };
  
      const response = await makeApiRequest("post", url, headers, JSON.stringify(requestBody));

      if (response) {
        return { status: "Impact Analysis created", data: response };
      } else {
        return { status: "Failed to create Impact Analysis" };
      }
    } catch (error) {
      console.error("Error creating Impact Analysis:", error);
      return { status: "An error occurred while creating Impact Analysis", error: error.message };
    }
};

// Service for modifying Change Action
export const modifyChangeAction = async (req, CAid, CAce, searchData) => {  
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;
  
      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");
  
      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
      const url = `${SOURCE_URL}/resources/v1/modeler/dslc/changeaction/${CAid}`;
  
      const requestBody = {
        cestamp: CAce,
        add: [
            { 
                members : [
                    { assignees: ["emrserviceuser"] },
                    { reviewers: ["emrserviceuser"] }
                ] 
            },
            { 
                proposedChanges: appendProposedParts(searchData, "CA") 
            }
        ]
    };

      const response = await makeApiRequest("patch", url, headers, JSON.stringify(requestBody));
  
      if (response) {
        return { status: "Change Action created and updated", data: response };
      } else {
        return { status: "Failed to update Change Action" };
      }
    } catch (error) {
      console.error("Error updating Change Action:", error);
      return { status: "Error while updating Change Action" };
    }
};

// Service for modifying Change Order
export const modifyChangeOrder = async (req, COid, COce, CAid, searchData) => {  
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;
  
      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");
  
      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
      const url = `${SOURCE_URL}/resources/v1/modeler/dscm/changeorder/${COid}`;
  
      const requestBody = {
        cestamp: COce,
        add: [
            {
                members: [
                    {
                        changeCoordinator: "emrserviceuser",
                        assignees: ["emrserviceuser"],
                        routeTemplates: [appendConstantKeys("Route Template", "6B8F27BD42FD0F0068076997000204B6", "dsrt/routetemplates")]
                    }
                ]
            },
            {
                orchestratedChanges: [appendConstantKeys("Change Action", CAid, "dslc/changeaction")]
            }
        ]
    };

      const response = await makeApiRequest("patch", url, headers, JSON.stringify(requestBody));
  
      if (response) {
        return { status: "Change Order created and updated", data: response };
      } else {
        return { status: "Failed to update Change Order" };
      }
    } catch (error) {
      console.error("Error updating Change Order:", error);
      return { status: "Error while updating Change Order" };
    }
};

// Service for modifying Change Request
export const modifyChangeRequest = async (req, CRid, CRce, COid, searchData) => {  
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;
  
      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");
  
      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
      const url = `${SOURCE_URL}/resources/v1/modeler/dscm/changerequest/${CRid}`;
  
      const requestBody = {
        cestamp: CRce,
        add: [
            {
                members: {
                    changeCoordinator: "emrserviceuser",
                    assignees: ["emrserviceuser"]
                }
            },
            {
                routeTemplates: [appendConstantKeys("Route Template", "6B8F27BD42FD0F0068076997000204B6", "dsrt/routetemplates")]
            },
            {
                implementingChanges: [appendConstantKeys("Change Order", COid, "dscm/changeorder")]
            },
            {
                affectedItems: appendProposedParts(searchData, "affect")
            }
        ]
    };

      const response = await makeApiRequest("patch", url, headers, JSON.stringify(requestBody));
  
      if (response) {
        return { status: "Change Request created and updated", data: response };
      } else {
        return { status: "Failed to update Change Request" };
      }
    } catch (error) {
      console.error("Error updating Change Request:", error);
      return { status: "Error while updating Change Request" };
    }
};

// Service for modifying Impact Analysis
export const modifyImpactAnalysis = async (req, IAid, IAce, CRid, searchData) => {  
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;
  
      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");
  
      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
      const url = `${SOURCE_URL}/resources/v1/modeler/dscm/changerequest/${CRid}/impactanalysis/${IAid}`;
  
      const requestBody = {
        cestamp: IAce,
        description: "Description of Impact Analysis",
        add: [
            {
                impactBasis: appendProposedParts(searchData, "affect")
            }
        ]
    };

      const response = await makeApiRequest("patch", url, headers, JSON.stringify(requestBody));
  
      if (response) {
        return { status: "Impact Analysis created and updated", data: response };
      } else {
        return { status: "Failed to update Impact Analysis" };
      }
    } catch (error) {
      console.error("Error updating Impact Analysis:", error);
      return { status: "Error while updating Impact Analysis" };
    }
};

// Service for Get CR cestamp
export const getCestamp = async (req, id, changeType) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;
  
      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");
  
      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
      const url = `${SOURCE_URL}/resources/v1/modeler/${changeType}/${id}`;

      const response = await makeApiRequest("get", url, headers);

      return response?.cestamp;
    } catch (error) {
      console.error("Error searching CR:", error);
    }
  };

// Service for promoting scenerios
export const promoteScenerio = async (req, id, state, type) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
      const url = `${SOURCE_URL}/resources/v1/modeler/dslc/maturity/changeState`;
  
      const requestBody = { data: [{ id: id, nextState: state }]};
  
      const response = await makeApiRequest("post", url, headers, JSON.stringify(requestBody));

      if (response) {
        return { status: `Promoted ${type} to ${state}`, data: response };
      } else {
        return { status: `Failed to Promote ${type} to ${state}` };
      }
    } catch (error) {
      console.error(`Error Promoting ${type} to ${state}`, error);
      return { status: `An error occurred while Promoting ${type} to ${state}`, error: error.message };
    }
};

// Service for approving scenerios for CA CR
export const approveScenerio = async (req, id, ce, changeType) => {    
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
      const isAction = changeType.includes('changeaction')
      const url = `${SOURCE_URL}/resources/v1/modeler/${changeType}/${id}/approve`;
      const method = isAction ? "put" : "post";

      const requestBody = { cestamp: ce, comment: "Approved" };  
  
      const response = await makeApiRequest(method, url, headers, JSON.stringify(requestBody));

      if (response) {
        return { status: `Approved ${isAction ? 'CA' : 'CR'}`, data: response };
      } else {
        return { status: `Failed to Approve ${isAction ? 'CA' : 'CR'}` };
      }
    } catch (error) {
      console.error(`Error Approving ${isAction ? 'CA' : 'CR'}`, error);
      return { status: `An error occurred while Approving ${isAction ? 'CA' : 'CR'}`, error: error.message };
    }
};

// Service for approving scenerio for CO
export const approveScenerioForCO = async (req, COid) => {
    try {
      const cookie = req?.Cookie;
      const csrf = req?.ENO_CSRF_TOKEN;

      if (!cookie) throw new Error("Missing or invalid cookie.");
      if (!csrf) throw new Error("Missing CSRF token.");

      const headers = createHeaders(cookie, csrf, "VPLMProjectLeader.0000000001.Micro Motion");
  
      const RouteUrl = `${SOURCE_URL}/resources/v1/modeler/routes?whereUsed=${COid}&tenant=OI000186152&timestamp=1742450358779&xrequestedwith=xmlhttprequest`;
      const RouteResponse = await makeApiRequest("get", RouteUrl, headers);
      const RouteId = RouteResponse?.data?.[0]?.id;

      const RouteInfoUrl = `${SOURCE_URL}/resources/v1/modeler/dsrt/routes/${RouteId}?%24include=tasks`;
      const RouteInfoResponse = await makeApiRequest("get", RouteInfoUrl, headers);
      const RouteInfoId = RouteInfoResponse?.data?.[0]?.tasks?.[0]?.id;

      const url = `${SOURCE_URL}/resources/v1/modeler/tasks/${RouteInfoId}`;
      const requestBody = { data: [{ dataelements: { routeTaskApprovalComments: "Approval Comments", state: "Complete", routeTaskApprovalAction: "Approve" }, updateAction: "MODIFY" }]}

      const response = await makeApiRequest("put", url, headers, JSON.stringify(requestBody));
      
      if (response) {
        return { status: "Approved CO", data: response };
      } else {
        return { status: "Failed to Approve CO" };
      }
    } catch (error) {
      console.error("Error Approving CO", error);
      return { status: "An error occurred while Approving CO", error: error.message };
    }
};