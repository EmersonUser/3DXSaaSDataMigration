// auth/config.js
import axios from "axios";
import https from "https";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Optional: Ignore SSL certificate errors if necessary
});

const axiosInstance = axios.create({
  httpsAgent,
  // timeout: 0, // timeout set to infinity
  headers: {
    Accept: "application/json",
    "User-Agent": "axios/1.8.2",
  },
});

export default axiosInstance;
