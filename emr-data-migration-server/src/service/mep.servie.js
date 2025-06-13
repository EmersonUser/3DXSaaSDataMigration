import axiosInstance from "../auth/config.js";
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
    SecurityContext: "VPLMProjectLeader.BU-0000001.Micro Motion",
    ENO_CSRF_TOKEN: ENO_CSRF_TOKEN,
    "Content-Type": "application/json",
    Cookie: Cookie,
  };
};
const createModiHeaders = ({ Cookie, ENO_CSRF_TOKEN }) => {
  return {
    SecurityContext: "VPLMProjectLeader.BU-0000001.Micro Motion",
    ENO_CSRF_TOKEN: ENO_CSRF_TOKEN,
    "Content-Type": "application/json",
    Cookie: Cookie,
    "X-Requested-With": "XMLHttpRequest",
  };
};
const createModifiedHeadersformanufactureItem = ({
  Cookie,
  ENO_CSRF_TOKEN,
}) => {
  return {
    SecurityContext: "VPLMProjectLeader.BU-0000001.Micro Motion",
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

export const searchMep = async (req) => {
  const { jsonData } = req;
  const result = [];

  await Promise.all(
    jsonData.map(async (res) => {
      const headers = createHeaders(req.authData);
      const url1 = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=${encodeURIComponent(
        res["MEP Name"]
      )}&$mask=dsmveng:EngItemMask.Details`;
      const url2 = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=${encodeURIComponent(
        res["Parent Name"]
      )}&$mask=dsmveng:EngItemMask.Details`;
      const result1 = await makeApiRequest("get", url1, headers);
      const result2 = await makeApiRequest("get", url2, headers);
      let ParentData = result2?.member;
      let isPresentMep = result1?.totalItems > 0 ? true : false;
      let isPresentparent = result2.totalItems > 0 ? true : false;
      if (!isPresentMep && isPresentparent) {
        result.push({
          isPresentparent: isPresentparent,
          ParentData: ParentData,
          isPresentMep: isPresentMep,
          alldata: { MepData: result1?.member, ProductData: result2?.member },
          isTitle: `${res["MEP Name"]}`,
          isManufacturable: true, // Assuming this is a constant value
          description: `${res["Description"]}` || "",
        });
      }
    })
  );
  return { result };
};
export const targetLocate = async (req) => {
  const headers = createModifiedHeaders(req.authData);
  const url = `https://oi000186152-us1-sourcing.3dexperience.3ds.com/enovia/resources/v1/modeler/dssrc/qualifications/targetLocate`;
  return await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(req.createReqMep)
  );
};
export const createMepProduct = async (req, res) => {
  const headers = createModifiedHeaders(req.authData);

  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem";
  return await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(req.createMepReqData)
  );
};
export const mepLocate = async (req, res) => {
  const headers = createModifiedHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dssrc/dssrc:ManufacturerEquivalentItems/locate";
  return await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(req.createReqMep)
  );
};
export const mepCreateService = async (req, res) => {
  const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dssrc/dssrc:ManufacturerEquivalentItems`;
  const headers = createModifiedHeadersformanufactureItem(req.authData1);
  console.log(
    JSON.stringify(req.createMeprequest),
    "createMeprequestcreateMeprequest>>>>"
  );
  return await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(req.createMeprequest)
  );
};
export const createQualifyResult = async (req, res) => {
  const url = `https://oi000186152-us1-sourcing.3dexperience.3ds.com/enovia/resources/v1/modeler/dssrc/qualifications`;

  const headers = createModifiedHeadersformanufactureItem(req.authDataQualify);

  return await makeApiRequest(
    "post",
    url,
    headers,
    JSON.stringify(req.createQualifyRequest)
  );
};
export const promoteState = async (req, res) => {
  const headers = createModifiedHeaders(req.authData);
  const url =
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState";
  const data = createPromated(req?.addMepProducts?.member);
  return await makeApiRequest("post", url, headers, data);
};
export const promoteMepState = async (req, res) => {
  const headers = createModiHeaders(req.authDataQualify);
  ///enovia/resources/v1/modeler/dslc/maturity/changeState'
  //'https://oi000186152-us1-sourcing.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState'
  const url =
    "https://oi000186152-us1-sourcing.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState";
  const data = createMepPromated(req?.createQualifyRes?.data);
  return await makeApiRequest("post", url, headers, data);
};

export const formatMepItems = (jsonData) => {
  const createdres = {
    items: jsonData?.map((item) => ({
      attributes: {
        title: item.isTitle,
        isManufacturable: item.isManufacturable, // Assuming this is a constant value
        description: item.description,
      },
    })),
  };
  return createdres;
};
export const createReqMepLocate = (jsonData) => {
  const res = jsonData.map((item) => ({
    source: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
    type: "VPMReference",
    identifier: item.id, // Use item.id directly
    relativePath: `/resource/v1/dseng/dseng:EngItem/${item.id}`, //
  }));

  return { engItem: res }; // Return the result
};
export const ReqMepCreate = (data, jsonData) => {
  console.log(jsonData, "jsonDatajsonData");
  return data.map((res, index) => ({
    engItem: {
      type: "VPMReference",
      identifier: `${res.id}`,
      relativePath: `/resource/v1/dseng/dseng:EngItem/${res.id}`,
    },
    manufacturerCompany: {
      identifier: "uuid:f635eda1-d663-4d18-a269-de034998a6e1",
      relativePath:
        "/3drdfpersist/resources/v1/modeler/dsvnp/dsvnp:SupplierCompany/uuid:f635eda1-d663-4d18-a269-de034998a6e1",
      source: "https://oi000186152-us1-3dnetwork.3dexperience.3ds.com:443",
      type: "SupplierCompany",
    },
    manufacturer: jsonData[index]["Supplier"] || "Sanyo",
    manufacturerPartNumber: `${res.title}`,
  }));
};
export const createQualify = async (mepData, resdata) => {
  // Initialize the response structure
  const res = {
    data: [],
  };

  // Loop through each MEP (Manufacturer Equivalent Part) data
  mepData.forEach((mep) => {
    // Create the structure for each item in the response
    const item = {
      type: "equivalentQualification", // Assuming a fixed type for the response
      description:
        `equivalentQualification ${mep.manufacturerPartNumber}` ||
        "equivalentQualification Test1", // Description based on MEP
      comments: "",
      preferred: "No", // Assuming this is fixed or needs to be calculated based on other factors
      approved: "Yes", // Assuming this is fixed or needs to be calculated based on other factors
      restriction:
        "performance should be monitored and restricted to plant ABC12325", // Assuming a fixed restriction message
      target: {
        identifier: mep.engItem.identifier,
        source: "https://oi000186152-us1-space.3dexperience.3ds.com:443/enovia",
        relativePath: mep.relativePath,
        id: mep.engItem.identifier,
        type: "Manufacturer Equivalent Item", // Assuming a fixed type for the target
      },
      context: resdata[0]?.ParentData?.map((parent) => ({
        identifier: parent.id,
        source: "https://oi000186152-us1-space.3dexperience.3ds.com:443/enovia", // Assuming 'partNumber' from parent data
        relativePath: `/resource/v1/dseng/dseng:EngItem/${parent.id}`,
        id: parent.id,
        type: parent.type, // Using parent type, assuming it will always be "VPMReference"
      })),
    };

    // Push the created item into the data array
    res.data.push(item);
  });
  console.log(JSON.stringify(res), "RESDARARRTA>>>");
  // Return the final response
  return res;
};
function createPromated(data) {
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
function createMepPromated(data) {
  const ids = data?.map((item) => item.id);

  // Create the JSON structure
  const jsonData = {
    data: ids?.map((id) => ({
      id: id,
      nextState: "Released",
    })),
  };

  return JSON.stringify(jsonData);
}
export const formatResult = async (
  jsonData,
  searchData,
  addMepProducts,
  mepLocateApi,
  mepCreateServiceResult,
  createQualifyRes,
  promoteMep,
  mepQualifyPromote
) => {
  // Initialize an empty array to hold the result data
  const resData = [];

  // Loop through each item in jsonData
  jsonData.map((dataItem, index) => {
    // Retrieve MepName from addMepProducts
    const mepNames = addMepProducts?.member?.map((res) => res.title);
    // Check if MepName matches the MEP Name in the dataItem
    if (mepNames.includes(dataItem["MEP Name"])) {
      // Extract the corresponding data from createQualifyRes and mepQualifyPromote

      const res =
        createQualifyRes?.data[createQualifyRes?.data.length - 1 - index]; // Data from createQualifyRes
      const mepQualifyPromoteRes =
        mepQualifyPromote?.results[
          mepQualifyPromote?.results.length - 1 - index
        ]; // Data from mepQualifyPromote
      // Push the matched data into resData
      resData.push({
        mepName: dataItem["MEP Name"],
        id: res?.id || null,
        name: res?.name || null,
        title: res?.title || null,
        description: res?.description || null,
        state: res?.state || null,
        approved: res?.approved || null,
        preferred: res?.preferred || null,
        owner: res?.owner || null,
        MEPpartcreation: "Success",
        MEP_qualifications: "Success",
        MEP_promotion: mepQualifyPromoteRes?.maturityState || "failed",

        // Expanding target fields
        targetId: res?.target?.id || null,
        targetType: res?.target?.type || null,
        targetSource: res?.target?.source || null,
        targetRelativePath: res?.target?.relativePath || null,

        // Expanding contexts fields
        contexts:
          res?.contexts?.map((ctx) => ({
            contextId: ctx.id || null,
            contextType: ctx.type || null,
            contextSource: ctx.source || null,
            contextRelativePath: ctx.relativePath || null,
          })) || [],
      });
    } else {
      // If MepName doesn't match, push the default failed data
      resData.push({
        mepName: dataItem["MEP Name"],
        id: null,
        name: null,
        title: null,
        description: null,
        state: null,
        approved: null,
        preferred: null,
        owner: null,
        MEPpartcreation: "failed",
        MEP_qualifications: "failed",
        MEP_promotion: "failed",

        // Expanding target fields
        targetId: null,
        targetType: null,
        targetSource: null,
        targetRelativePath: null,

        // Expanding contexts fields
        contexts:
          dataItem?.contexts?.map((ctx) => ({
            contextId: null,
            contextType: null,
            contextSource: null,
            contextRelativePath: null,
          })) || [],
      });
      index--;
    }
  });

  // Return the array containing all the processed data
  return resData;
};
export const targetLocateReq = async (req) => {
  return {
    data: [
      {
        identifier: "31E7391541CC190068232543000F884D",
        source: "https://OI000186152-us1-space.3dexperience.3ds.com/enovia",
        relativePath:
          "/resources/v1/modeler/dssrc/dssrc:ManufacturerEquivalentItems/31E7391541CC190068232543000F884D",
        id: "31E7391541CC190068232543000F884D",
        type: "Manufacturer Equivalent Item",
      },
    ],
  };
};
