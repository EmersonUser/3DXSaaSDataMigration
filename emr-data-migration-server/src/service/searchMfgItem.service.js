
import https from "https";
import axios from "axios";
import axiosInstance from "../auth/config.js";


const createHeaders = ({ Cookie, ENO_CSRF_TOKEN, SecurityContext }) => {
  return {
    SecurityContext: SecurityContext,
    ENO_CSRF_TOKEN: ENO_CSRF_TOKEN,
    "Content-Type": "application/json",
    Cookie: Cookie,
  };
};

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
    } else if (error.request) {
      console.error("Request data:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    return {status: "Error while searching Mfg Item: ", error};
  }
};

export const searchMfgItem = async (authData, jsonData) => {
  const searchedMfgData = [];
  const customMfgValue = [];
  const matchedMfg = [];
  const unmatchedMfg= [];
  const customMfgSearchedData = [];

  await Promise.all(
    jsonData.map(async (res) => {
      if (res?.Custom === "custom") {
        customMfgValue.push(res);
        const agent = new https.Agent({
          rejectUnauthorized: false,
        });
      

      const headers = createHeaders(authData);
        const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/search?$searchStr=${encodeURIComponent(
                res?.Title
               )}`;
        const result = await makeApiRequest("get", url, headers);
        customMfgSearchedData?.push(result?.member);
        
      } else {
        const agent = new https.Agent({
          rejectUnauthorized: false,
        });

        const headers = createHeaders(authData);
        const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/search?$searchStr=${encodeURIComponent(
                res?.Title
               )}`;
        const result = await makeApiRequest("get", url, headers);
          if (result?.totalItems === 0) {
            unmatchedMfg.push(res);
          } else {
            matchedMfg.push(result?.member);
          }
      }
    })
  );
  return { matchedMfg, unmatchedMfg, customMfgValue, customMfgSearchedData };
};