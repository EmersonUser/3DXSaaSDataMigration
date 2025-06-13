// src/services/products.service.js
import axiosInstance from "../auth/config.js";
import xlsx from "xlsx";
import FormData from 'form-data';

// Function to search for documents
// export const searchDocument = async (req, res) => { 
//   let jsessionidCookie = req?.authData?.cookies.find((cookie) =>
//     cookie.startsWith("JSESSIONID=")
//   );
//   let jsessionid = jsessionidCookie
//     ? jsessionidCookie.split(";")[0].split("=")[1]
//     : null;
//   const config = {
//     method: "get",
//     maxBodyLength: Infinity,
//     url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/documents/search?searchStr=DOC-OI000186152-0000971",
//     headers: {
//       SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
//       ENO_CSRF_TOKEN: `${req?.authData?.csrf.value}`,
//       Cookie: `JSESSIONID=${jsessionid}; SERVERID=MT_Metadata_0_7025`,
//     },
//   };
//   const checkInTicketDocumentConfig = {
//     method: "put",
//     maxBodyLength: Infinity,
//     url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/documents/files/CheckinTicket",
//     headers: {
//       SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
//       ENO_CSRF_TOKEN: `${req?.authData?.csrf.value}`,
//       Cookie: `JSESSIONID=${jsessionid}; SERVERID=MT_Metadata_0_7025`,
//     },
//   }
//   try {
//     const response = await axiosInstance.request(config);
//     // const checkInTicketDocumentResponse = await axiosInstance.request(checkInTicketDocumentConfig);
//     const extractTicket = (data) => {
//         const [{ dataelements: { ticket } = {} } = {}] = data;
//         return {"ticket": ticket, data : response} || null;
//       };
      
//       const ticket = extractTicket(checkInTicketDocumentResponse.data.data);
//       let data = new FormData();
//       data.append('__fcs__jobTicket', ticket.ticket);
//       data.append('file_0', req.file.buffer, req.file.originalname); // Use req.file.buffer and req.file.originalname
  
//     const checkInFileConfig = {
//         method: "post",
//         maxBodyLength: Infinity,
//         url: "https://stg001us1-dfcs.3dexperience.3ds.com/fcs/servlet/fcs/checkin",
//         data: {
//             "file_0": req.file,
//             "__fcs__jobTicket": ticket.ticket
//         },
//         headers: {
//           SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
//           ENO_CSRF_TOKEN: `${req?.authData?.csrf.value}`,
//           Cookie: `JSESSIONID=${jsessionid}; SERVERID=MT_Metadata_0_7025`,
//         },
//     }
   
//     const checkInFileResponse = await axiosInstance.request(checkInFileConfig);
//     console.log("$$checkInFileResponse", checkInFileResponse);
//     return ticket; // Return the ticket
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     // throw new Error("Error fetching products"); // Throw an error to be handled by the caller
//   }
// };

// Set the destination for uploaded files
export const readExcelFile = async (filePath) => {
  // Read the Excel file
  const workbook = xlsx.readFile(filePath);

  const sheetName = workbook.SheetNames[0]; // Get the first sheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert the sheet to JSON
  const jsonData = xlsx.utils.sheet_to_json(worksheet);
  return jsonData;
};


