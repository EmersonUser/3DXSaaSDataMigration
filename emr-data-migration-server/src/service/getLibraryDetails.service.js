import axiosInstance from "../auth/config.js";
import os from "os";
import axios from "axios";
import https from "https";

export const getLibraryDetails = async (req, libraryID) => {
  const agent = new https.Agent({
        rejectUnauthorized: false, // Adjust this based on your security requirements
      });

  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:Library/${libraryID}?$mask=dslib:ExpandClassesDetailsMask`,
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": req["Content-Type"],
    },
  };

  try {
    const response = await axios.get(`${config.url}`, {
      headers: config.headers,
      httpsAgent: agent,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting the library details:", error);
    throw new Error("Error getting library details");
  }
};
