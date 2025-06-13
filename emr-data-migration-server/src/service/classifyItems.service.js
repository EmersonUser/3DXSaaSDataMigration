import { findIdByTitle } from "../utils/utilsParts.js";
import axios from "axios";
import https from "https";

export const classifyItems = async (
  req,
  documentData,
  memberData,
  isRevisedItems = false
) => {
  const id = findIdByTitle(memberData, "Engineering Drawing");
  const arrayOfObjectsToClassify = documentData?.map((item) => {
    return {
      source: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
      type: item.type,
      identifier: item.identifier,
      relativePath: item.relativePath,
    };
  });

  const revisedItemsToClassify = documentData?.map((item) => {
    return {
      source: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
      type: "Document",
      identifier: item.physicalid,
      relativePath: `/resources/v1/modeler/documents/${item.physicalid}`,
    };
  });
  const payload = {
    ClassID: id,
    ObjectsToClassify: isRevisedItems
      ? revisedItemsToClassify
      : arrayOfObjectsToClassify,
  };
  const agent = new https.Agent({
    rejectUnauthorized: false, // Adjust this based on your security requirements
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem",
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
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
    console.error("Error while reviseing a document:", error);
    throw new Error("Error while reviseing a document");
  }
};
