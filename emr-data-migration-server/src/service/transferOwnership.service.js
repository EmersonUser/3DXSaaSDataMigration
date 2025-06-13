import https from "https";
import axios from "axios";

export const transferOwnership = async (
  authData,
  physicalIds,
  owner,
  organization,
  collabspace
) => {
  const transferOwnershipPayload = physicalIds?.map((id) => {
    return {
      id: id,
    };
  });

  const payload = {
    owner: owner,
    organization: organization,
    collabspace: collabspace,
    data: transferOwnershipPayload,
  };

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/ownership/transfer`,
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: authData?.ENO_CSRF_TOKEN,
      Cookie: authData?.Cookie,
      "Content-Type": authData["Content-Type"],
    },
    data: payload,
  };
  try {
    const transferOwnership = await axios.post(`${config.url}`, payload, {
      headers: config.headers,
      httpsAgent: agent,
    });
    return transferOwnership.data;
  } catch (error) {
    console.error("Error while ownership transfer:", error);
  }
};
