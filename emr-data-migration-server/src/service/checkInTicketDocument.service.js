import axiosInstance from "../auth/config.js";
import { checkInFile } from "./checkIn.service.js";

export const getCheckInTicketDocument = async (req, file) => {
  const config = {
    method: "PUT",
    maxBodyLength: Infinity,
    url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/documents/files/CheckinTicket",
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": req["Content-Type"],
    },
    timeout: 900000, // 15 mins timeout
  };

  try {
    const response = await axiosInstance.request(config);
    const extractTicket = (data = []) => {
      const [{ dataelements: { ticket } = {} } = {}] = data;
      return { ticket: ticket } || null;
    };

    const ticket = extractTicket(response?.data?.data);
    const responseforCheckin = await checkInFile(req, file, ticket);
    return { ticket: ticket, CheckinFile: responseforCheckin };
  } catch (error) {
    console.error("Error getting check-in ticket document:", error);
    // throw new Error("Error getting check-in ticket document");
  }
};
