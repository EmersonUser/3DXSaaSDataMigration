import https from "https";
import axios from "axios";

// Service for disconnecting old scoped Eng item & creating a new scope with latest rev of Eng item
export const disconnectOldScopedEngItem = async (
  authData,
  scopedEngItemObject,
  idMfgItem
) => {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${idMfgItem}/dsmfg:ScopeEngItem/detach`,
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: authData?.ENO_CSRF_TOKEN,
      Cookie: authData?.Cookie,
      "Content-Type": authData["Content-Type"],
    },
    data: scopedEngItemObject,
  };
  try {
    const detachScopeResponse = await axios.post(
      `${config.url}`,
      scopedEngItemObject,
      {
        headers: config.headers,
        httpsAgent: agent,
      }
    );
    return detachScopeResponse.data;
  } catch (error) {
    console.error("Error while detaching scope link:", error);
    return { status: "Error while detaching scope link:", error };
  }
};
