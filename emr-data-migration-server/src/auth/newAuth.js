import axios from "axios";
import https from "https";
// import authConfig  from '../config/authConfig';

const authConfig = {
  username: "3dxserviceuser@emerson.com",
  password: "Emerson123",
  SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
  // SecurityContext: "ctx%3A%3AVPLMProjectLeader.Company%20Name.MSOL-Corrosion%20%26%20Erosion",
  AuthURL: "https://oi000186152-eu1.iam.3dexperience.3ds.com/login?",
  CSRFURL:
    "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152",
  AuthParamURL:
    "https://oi000186152-eu1.iam.3dexperience.3ds.com/login?action=get_auth_params",
  currentUserContextURL: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/modeler/pno/person/?current=true&select=collabspaces`,
  "Content-Type": "application/json;charset=UTF-8",
};

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export const authenticateUser = async (req, res, next) => {
  try {
    const { AuthURL, AuthParamURL, CSRFURL, username, password } = authConfig;
    console.log(
      "###########",
      AuthURL,
      AuthParamURL,
      CSRFURL,
      username,
      password
    );
    // Make a request to the 3rd party API using Axios
    const response = await axios.get(AuthParamURL, { httpsAgent: agent });
    console.log(response?.data?.lt);
    const LoginToken = response?.data?.lt;
    const AuthURLComplete = `${AuthURL}lt=${LoginToken}&username=${username}&password=${password}&service=${CSRFURL}`;
    const loginCookies = response.headers["set-cookie"];

    const csrfTockenURLResponse = await axios.post(AuthURLComplete, null, {
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
      headers: {
        Cookie: loginCookies?.join("; "),
        "Content-Type": response.headers["Content-Type"],
        "User-Agent": "test",
      },
    });

    const afterLogInCookies = csrfTockenURLResponse.headers["set-cookie"];
    const csrfValue = csrfTockenURLResponse?.data?.csrf?.value;

    const headersForFutureRequests = {
      Cookie: afterLogInCookies?.join("; "),
      ENO_CSRF_TOKEN: csrfValue,
      "Content-Type": "application/json",
    };

    const defaultSecContext = await getDefaultSecurityContext(
      headersForFutureRequests
    );
    headersForFutureRequests.SecurityContext = defaultSecContext;
    req.authData = headersForFutureRequests;
    // Return the authentication token
    return req;
  } catch (error) {
    console.log(error);
    // Handle any errors that occur during the request
    throw new Error("Failed to authenticate user");
  }
};

export const getDefaultSecurityContext = async (headersForFutureRequests) => {
  try {
    const headers = {
      Cookie: headersForFutureRequests.Cookie,
      SecurityContext: headersForFutureRequests.SecurityContext,
      ENO_CSRF_TOKEN: headersForFutureRequests.ENO_CSRF_TOKEN,
      "Content-Type": headersForFutureRequests["Content-Type"],
    };

    const currentUserContextURL = authConfig.currentUserContextURL;
    const securityContextResponse = await axios.get(currentUserContextURL, {
      headers,
      httpsAgent: agent,
    });

    const firstCollabSpaceDetails =
      securityContextResponse?.data?.collabspaces[0];
    const defaultSecContext = `${firstCollabSpaceDetails?.couples[0]?.role?.name}.${firstCollabSpaceDetails?.couples[0]?.organization?.name}.${firstCollabSpaceDetails?.name}`;
    return defaultSecContext;
  } catch (error) {
    console.log(error);
    // Handle any errors that occur during the request
    throw new Error("Failed to get default security context");
  }
};
