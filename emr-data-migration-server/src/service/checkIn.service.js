import axiosInstance from "../auth/config.js";
import FormData from "form-data";
import fs from "fs";

export const checkInFile = async (req, file, ticket) => {
  let jsessionidCookie = req?.authData?.cookies.find((cookie) =>
    cookie.startsWith("JSESSIONID=")
  );
  let jsessionid = jsessionidCookie
    ? jsessionidCookie.split(";")[0].split("=")[1]
    : null;

  let data = new FormData();
  data.append("__fcs__jobTicket", ticket.ticket);

  // Read the file from disk since `req.file.buffer` is undefined
  const filePath = file?.path;
  const fileBuffer = fs.readFileSync(filePath); // Read the file as a buffer

  data.append("file_0", fileBuffer, {
    filename: file?.originalname,
    contentType: file?.mimetype,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://stg001us1-dfcs.3dexperience.3ds.com/fcs/servlet/fcs/checkin",
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": req["Content-Type"],
      ...data.getHeaders(),
    },
    timeout: 900000, // 15 mins timeout
    data: data,
  };

  try {
    const response = await axiosInstance.request(config);
    return response?.data;
  } catch (error) {
    console.error("Error checking in file:", error);
    throw new Error("Error checking in file");
  }
};
