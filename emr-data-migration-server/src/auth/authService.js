// auth/authService.js
import axiosInstance from "./config.js";

export const getLTdata = async () => {
  const config = {
    method: "get",
    url: "https://oi000186152-eu1.iam.3dexperience.3ds.com/login?action=get_auth_params",
    // headers: {
    //   Cookie:
    //     "CASTGC_prd_common=TGT-10134640-iSCTwZwzglJETTh99LOHdb761X3wrzGIupwQeHj3nZEojNFI9l-cas; global_auth_user=e1331143; CASTGC_oi000186152=TGT-7075165-werwZ1sHFltRPOz6sQ2h7r0ysPKbAahmruxIazPj5JhYcpGRI7-cas; JSESSIONID=61A4A42578D19C861D04FC3700DF9813; SERVERID=PASSPORT_HttpdTomcatServer_3_8180; afs=b5ddb392-2d1c-482b-94fe-e169cba57325",
    // },
  };

  try {
    const response = await axiosInstance.request(config);

    const cookies = response.headers["set-cookie"];
    return [response.data, cookies]; // Return the response data
  } catch (error) {
    console.error("Error fetching LT data:", error);
    throw new Error("Error fetching LT data");
  }
};

export const getCRSFtoken = async (lt, cookies) => {
  let jsessionidCookie = cookies.find((cookie) =>
    cookie.startsWith("JSESSIONID=")
  );
  let jsessionid = jsessionidCookie
    ? jsessionidCookie.split(";")[0].split("=")[1]
    : null;
  const config = {
    method: "post",
    url: `https://oi000186152-eu1.iam.3dexperience.3ds.com/login?lt=${lt}&username=sudarshan.sambamurthy@emerson.com&password=Wimbledon2023*&service=https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152`,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Cookie: `global_auth_user=e1331143; JSESSIONID=${jsessionid}; SERVERID=PASSPORT_HttpdTomcatServer_3_8180; afs=b5ddb392-2d1c-482b-94fe-e169cba57325`,
    },
  };

  try {
    const response = await axiosInstance.request(config);
    const cookies = response?.headers["set-cookie"];
    return { ...response.data, cookies }; // Return the response data
  } catch (error) {
    console.error("Error during authentication:", error);
    throw new Error("Error during authentication");
  }
};
