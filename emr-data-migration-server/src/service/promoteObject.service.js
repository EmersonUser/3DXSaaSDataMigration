import axiosInstance from "../auth/config.js";

export const promoteObject = async (req, documentData) => {
  let promoteResponse = [];
  const identifiers = documentData?.map((obj) => ({
    id: obj?.id || obj?.physicalid,
  }));

  const states = ["FROZEN", "RELEASED"];

  for (const nextState of states) {
    const data = {
      data: identifiers.map((obj) => ({
        id: obj.id,
        nextState: nextState,
      })),
    };

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/maturity/changeState",
      headers: {
        SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
        ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
        "Content-Type": req["Content-Type"],
        Cookie: req?.Cookie,
      },
      data: data,
    };
    try {
      const response = await axiosInstance.request(config);
      promoteResponse.push(response?.data);
    } catch (error) {
      console.error("Error while promoting an object:", error);
    }
  }
  return promoteResponse;
};
