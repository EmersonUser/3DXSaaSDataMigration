import axiosInstance from "../auth/config.js";
import { makeApiRequest } from "../utils/utilsParts.js";
import { promoteObject } from "./promoteObject.service.js";

export const reviseService = async (req, createDocData, jsonData, isMfg = false) => {
  const reviseResponse = [];
  const revisePayloadData = createDocData?.map(({ id }) => {
    return {
      physicalid: id,
      modifiedAttributes: {
        revision: jsonData[0]["Spec Rev"],
      },
      proposedRevision: jsonData[0]["Spec Rev"],
    };
  });

  const payload = {
    data: revisePayloadData,
    folderid: null,
    notificationTimeout: 600,
    metrics: {
      UXName: "Revise",
      client_app_domain: "3DEXPERIENCE 3DDashboard",
      client_app_name: "ENXENG_AP",
    },
  };
  const mfgPayload = {
    data: revisePayloadData,
  }
  console.log("Payload for revise", payload);
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/lifecycle/revise/major?tenant=OI000186152&xrequestedwith=xmlhttprequest",
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
    },
    data: isMfg ? mfgPayload: payload,
  };
  const { dataelements } = createDocData[0];

  if ((dataelements && Number(jsonData[0]["Spec Rev"]) < Number(dataelements?.revision)) || (jsonData[0]["Spec Rev"] === createDocData[0]?.revision)) {
    if(isMfg){
      return {message: `Revision number is less than or equal to the provided revision for title, ${createDocData?.[0]?.title}`};
    }else {
      throw new Error("Revision number is less than the current revision");
    }
  } else {
    console.log(
      "Revision number is greater than the current revision",
      dataelements?.state === "RELEASED" &&
        jsonData[0]["Spec Rev"] > dataelements?.revision
    );
    //commenting for future use
    // if (
    //   dataelements?.state === "RELEASED" &&
    //   jsonData[0]["Spec Rev"] > dataelements?.revision
    // ) {
    const response = await makeApiRequest(config);
    reviseResponse.push(response);
    console.log("###Response from revise", response);
    if(!isMfg){
    const promotedResponse = await promoteObject(req, response?.results);
    if (promotedResponse) {
      // Flatten results
      const flattenedResults = promotedResponse?.flatMap(
        (entry) => entry.results
      );
      // Group by ID
      const groupedResults = flattenedResults?.reduce((acc, item) => {
        if (!acc[item.id]) {
          acc[item.id] = [];
        }
        acc[item.id].push(item);
        return acc;
      }, {});

      // Final response object
      const promotoedresponse = {
        message: "Document promoted successfully",
        groupedResults,
      };
      reviseResponse.push(promotoedresponse);
    }
  }
    return reviseResponse;
  // }
  // }
}
}
