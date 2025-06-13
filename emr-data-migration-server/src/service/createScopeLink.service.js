import https from "https";
import axios from "axios";

import { promoteObject } from "./promoteObject.service.js";

// Service for creating a MfgItem
export const createScopeBetweenEnggAndMfgItem = async (
  authData,
  reqBodyToCreateScope,
  idMfgItem
) => {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${idMfgItem}/dsmfg:ScopeEngItem/attach`,
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: authData?.ENO_CSRF_TOKEN,
      Cookie: authData?.Cookie,
      "Content-Type": authData["Content-Type"],
    },
    data: reqBodyToCreateScope,
  };
  try {
    const createScopeResponse = await axios.post(
      `${config.url}`,
      reqBodyToCreateScope,
      {
        headers: config.headers,
        httpsAgent: agent,
      }
    );
    const promotedResponse = await promoteObject(authData, [
      { physicalid: idMfgItem },
    ]);
    return {
      createScope: createScopeResponse.data,
      promote: JSON.stringify(promotedResponse),
    };
  } catch (error) {
    console.error("Error while creating scope link:", error);
    return { status: "Error while creating scope link:", error };
  }
};
