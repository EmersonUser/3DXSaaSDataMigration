import axios from "axios";
import https from "https";

export const createDocumentCopy = async (
  req,
  documentTitles,
  receipts,
  files
) => {
  const payloadTitleData = documentTitles?.map((title, index) => {
    return {
      dataelements: {
        name: title,
        policy: "Document Release",
        state: "IN_WORK",
        title: title, // Updating the title
        description: "This is a test description",
      },
      relateddata: {
        files: [
          {
            dataelements: {
              title: receipts[index]?.originalFile?.originalname, // Updating the title
              receipt: receipts[index]?.checkinResponse, // Use the corresponding receipt
            },
            updateAction: "CREATE",
          },
        ],
      },
    };
  });

  const payload = {
    data: payloadTitleData,
  };
  console.log("#########Create payload", JSON.stringify(payload));
  const agent = new https.Agent({
    rejectUnauthorized: false, // Adjust this based on your security requirements
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/documents",
    headers: {
      SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion",
      ENO_CSRF_TOKEN: req?.ENO_CSRF_TOKEN,
      Cookie: req?.Cookie,
      "Content-Type": req["Content-Type"],
    },
    data: payload,
    timeout: 900000, //  15 mins timeout
  };

  try {
    const response = await axios.post(`${config.url}`, payload, {
      headers: config.headers,
      httpsAgent: agent,
      timeout: config.timeout,
    });
    console.log("#########Create response", response?.data);
    
    return response?.data;
  } catch (error) {
    console.error("Error while creating document copy:", error);
    // throw new Error("Error while creating document copy");
  }
};
