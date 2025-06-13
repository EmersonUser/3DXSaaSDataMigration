import axiosInstance from "../auth/config.js";
import https from "https";
import axios from "axios";

// Service for creating a MfgItem
export const createMfgItem = async (authData, createReqData) => {
  let createResponse = [];

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem",
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: authData?.ENO_CSRF_TOKEN,
      Cookie: authData?.Cookie,
      "Content-Type": authData["Content-Type"],
    },
    data: JSON.stringify(createReqData),
  };
  try {
    const createMfgResponse = await axios.post(`${config.url}`, createReqData, {
      headers: config.headers,
      httpsAgent: agent,
    });
    return createMfgResponse.data;
  } catch (error) {
    console.error("Error creating MfgItem:", error);
    return { status: "Error while creating MfgItem:", error };
  }
};
