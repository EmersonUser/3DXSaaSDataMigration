import https from "https";
import axios from "axios";

// Service for creating a MfgItem
export const getScopedEngItem = async (authData, revisedMfgId) => {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${revisedMfgId}/dsmfg:ScopeEngItem`,

    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: authData?.ENO_CSRF_TOKEN,
      Cookie: authData?.Cookie,
      "Content-Type": authData["Content-Type"],
    },
  };
  try {
    const resGetScopedEngitem = await axios.get(`${config.url}`, {
      headers: config.headers,
      httpsAgent: agent,
    });
    return resGetScopedEngitem.data;
  } catch (error) {
    console.error("Error getting scoped Eng Item:", error);
    return { status: "Error while getting scoped Eng Item:", error };
  }
};
