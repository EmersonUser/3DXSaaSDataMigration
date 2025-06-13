
import https from "https";
import axios from "axios";

export const searchEngItem = async (authData, jsonData) => {
  const customValue = [];
  const matched = [];
  const unmatched= [];
  const customSearchedData = [];

  await Promise.all(
    jsonData.map(async (res) => {
      const engItemName = res["Engineering Item Name"];
      if (res?.Custom?.toLowerCase() === "custom") {
        customValue.push(res);
        const agent = new https.Agent({
          rejectUnauthorized: false,
        });
        const config = {
          method: "get",
          maxBodyLength: Infinity,
          url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=${encodeURIComponent(
            engItemName
        )}`,
          headers: {
            SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
            ENO_CSRF_TOKEN: authData?.ENO_CSRF_TOKEN,
            Cookie: authData?.Cookie,
            "Content-Type": "application/json",
            "Content-Type": authData["Content-Type"],
          },
          timeout: 150000,
        };
        try {
          const response = await axios.get(`${config.url}`, {
            params: {
              searchStr: res?.Title,
            },
            headers: config.headers,
            httpsAgent: agent,
          });
          customSearchedData?.push(response?.data?.member);
       } catch (error) {
          console.error("Error searching Eng Item:", error);
          return { status:"Error searching the required Eng Item", error};
        }
        
      } else {
        const agent = new https.Agent({
          rejectUnauthorized: false,
        });
        const config = {
          method: "get",
          maxBodyLength: Infinity,
          url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/search?$searchStr=${encodeURIComponent(
            engItemName
        )}`,
          headers: {
            SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
            ENO_CSRF_TOKEN: authData?.ENO_CSRF_TOKEN,
            Cookie: authData?.Cookie,
            "Content-Type": "application/json",
            "Content-Type": authData["Content-Type"],
          },
          timeout: 150000,
        };

        try {
          const response = await axios.get(`${config.url}`, {
            params: {
              searchStr: engItemName,
            },
            headers: config.headers,
            httpsAgent: agent,
          });
          if (response?.data?.totalItems === 0) {
            unmatched.push(res);
          } else {
            matched.push((response?.data?.member));
          }

        } catch (error) {
          console.error("Error searching Eng Item:", error);
          return { status:"Error searching the required Eng Item", error};
        }
      }
    })
  );
  return { matched, unmatched, customValue, customSearchedData };
};