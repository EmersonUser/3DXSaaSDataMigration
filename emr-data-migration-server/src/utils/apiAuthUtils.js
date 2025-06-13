import axiosInstance from "../auth/config.js";

/**
 * Helper function to extract JSESSIONID from cookies.
 * @param {Array} cookies - List of cookies in the request.
 * @returns {string|null} - Extracted JSESSIONID or null.
 */
export const getJSessionId = (cookies) => {
  const jsessionidCookie = cookies?.find((cookie) =>
    cookie.startsWith("JSESSIONID=")
  );
  return jsessionidCookie ? jsessionidCookie.split(";")[0].split("=")[1] : null;
};

/**
 * Helper function to create the request headers with JSESSIONID and CSRF token.
 * @param {string} jsessionid - The JSESSIONID to be used in headers.
 * @param {string} csrfToken - The CSRF token to be included in the request.
 * @param {string} securityContext - Security context for the request.
 * @returns {Object} - The headers object.
 */
export const createHeaders = (jsessionid, csrfToken, securityContext) => {
  return {
    SecurityContext: securityContext,
    ENO_CSRF_TOKEN: csrfToken,
    "Content-Type": "application/json",
    Cookie: `JSESSIONID=${jsessionid}; SERVERID=MT_Metadata_1_7025`,
  };
};

/**
 * Generic function to make API requests.
 * @param {string} method - The HTTP method (e.g., 'get', 'post').
 * @param {string} url - The URL to which the request will be sent.
 * @param {Object} headers - The headers to include in the request.
 * @param {Object|string} data - The data to send with the request (for POST).
 * @returns {Object} - The response data from the API.
 */
export const makeApiRequest = async (method, url, headers, data = null) => {
  const config = {
    method,
    maxBodyLength: Infinity,
    url,
    headers,
    data,
  };
  console.log("####,config:", config)
  try {
    const response = await axiosInstance.request(config);
    return response.data;
  } catch (error) {
    console.error(`Error during ${method} request to ${url}:`, error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      console.error("Request data:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    throw new Error(`Error during ${method} request: ${error.message}`);
  }
};