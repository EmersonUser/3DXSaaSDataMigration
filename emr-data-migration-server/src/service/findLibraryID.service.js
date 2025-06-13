import axiosInstance from "../auth/config.js";
import { getLibraryDetails } from "./getLibraryDetails.service.js";
import axios from "axios";
import https from "https";

export const findLibraryID = async (req) => {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:Library/search?$searchStr=OLD_Micro Motion",
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": "application/json",
      "Content-Type": req["Content-Type"],
    },
  };

  try {
    const response = await axios.get(`${config.url}`, {
      headers: config.headers,
      httpsAgent: agent,
    });
    const microMotion = response?.data?.member?.find(
      (item) => item.title === "OLD_Micro Motion"
    );

    // Extract the ID
    const libraryID = microMotion ? microMotion.id : null;
    if (!libraryID) {
      throw new Error("Library ID not found");
    }
    if (libraryID) {
      const libraryDetails = await getLibraryDetails(req, libraryID);
      return libraryDetails;
    }
  } catch (error) {
    console.error("Error finding library ID:", error);
    //  throw new Error("Error finding library ID");
  }
};
