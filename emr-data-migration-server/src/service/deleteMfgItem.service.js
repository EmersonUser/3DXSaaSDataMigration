import axios from "axios";
import https from "https";

export const deleteMfgItem = async (req, id) => {
  const agent = new https.Agent({
    rejectUnauthorized: false, // Adjust this based on your security requirements
  });

  const config = {
    method: "delete",
    maxBodyLength: Infinity,
    url: `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${id}`,
    headers: {
      SecurityContext: "VPLMAdmin.Company%20Name.Default",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": req["Content-Type"],
    },
  };

  try {
    const response = await axios.delete(`${config.url}`, {
      headers: config.headers,
      httpsAgent: agent,
    });
    
    // Check if the response contains the expected data
    if (response.status === 200) {
      return {
        message: `Mfg Item deleted successfully with ID: ${id}`,
        data: response.data,
      };
    }
    return response.data;
  } catch (error) {
    console.error("Error deleting the Mfg Item: ", error);
    return {status: "Error deleting the Mfg Item: ", error};
  }
};
