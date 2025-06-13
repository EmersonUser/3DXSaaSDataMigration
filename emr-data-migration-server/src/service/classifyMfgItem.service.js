import { findIdByTitle } from "../utils/utilsParts.js";
import axios from "axios";
import https from "https";

export const classifyItem = async (req, payload) => {
 
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem",
    headers: {
      SecurityContext: "VPLMAdmin.Company%20Name.Default",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": req["Content-Type"],
    },
    data: payload,
  };

  try {
    const response = await axios.post(`${config.url}`, payload, {
      headers: config.headers,
      httpsAgent: agent,
    });
    return response?.data;
  } catch (error) {
    console.error("Error while classifying object:", error);
    return {status: "Error while classifying object:", error};
  }
};

export const getCestamp = async(req, idEnggItem)=>{
    const agent = new https.Agent({
        rejectUnauthorized: false,
      });
    
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem/${idEnggItem}?$mask=dslib:ClassificationAttributesMask`,
        headers: {
          SecurityContext: "VPLMAdmin.Company%20Name.Default",
          ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
          Cookie: req?.Cookie,
          "Content-Type": req["Content-Type"],
        },
      };
    
      try {
        const response = await axios.get(`${config.url}`,{
          headers: config.headers,
          httpsAgent: agent,
        });
        return response?.data?.member?.[0]?.cestamp;
      } catch (error) {
        console.error("Error while getting cestamp:", error);
        return {status: "Error while getting cestamp:", error};
      }
};

export const updateItem = async(req, payload)=>{
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem/modify",
    headers: {
      SecurityContext: "VPLMAdmin.Company%20Name.Default",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": req["Content-Type"],
    },
    data: payload,
  };

  try {
    const response = await axios.post(`${config.url}`, payload, {
      headers: config.headers,
      httpsAgent: agent,
    });
    return response?.data;
  } catch (error) {
    console.error("Error while updating classified object:", error);
    return {status: "Error while updating classified object:", error};
  }
};
