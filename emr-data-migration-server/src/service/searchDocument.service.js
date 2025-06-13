import axiosInstance from "../auth/config.js";
import axios from "axios";
import https from "https";
import {
  parsePipeSeparatedData,
  searchProductsWithRevision,
} from "../utils/utilsParts.js";

export const searchDocument = async (req, title, part = null) => {
  
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  let parsedParts = [];
  if (part) {
    parsedParts = parsePipeSeparatedData(part);
  }

  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/documents/search?searchStr=name=${title}`,
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": "application/json",
      "Content-Type": req["Content-Type"],
      // "User-Agent": "axios/1.8.2",
    },
    timeout: 150000,
  };

  // Search for the document using the title
  try {
    const docSearchRes = await axios.get(`${config.url}`, {
      params: {
        searchStr: title,
      },
      headers: config.headers,
      httpsAgent: agent,
    });
    const searchProducts = await searchProductsWithRevision(parsedParts, req);
    return { searchResponse: docSearchRes?.data, productData: searchProducts };
  } catch (error) {
    console.error("Error searching document:", error);
    throw new Error("Error searching the required document");
  }
};
