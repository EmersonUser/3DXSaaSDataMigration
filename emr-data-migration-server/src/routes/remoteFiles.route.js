// src/routes.js (or wherever your routes are defined)
import express from "express";
import { authenticateUser } from "../auth/index.js";
 import { connectToFileShare } from "../utils/remoteFileShare.js"; // Use 'import' and add the .js extension
 import { getFileClient } from "../utils/remoteFileShare.js";
import multer from "multer";
import {
  ShareServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-file-share";

const router = express.Router();

// Replace with your Azure Storage account name and key
const account = "plmsharedrive";
const accountKey =
  "PSeSrmysg5IhgGpTUVtYghSeQYVvryT1pseUSAfbBtiqFsW404vBqqn8Eih4V90nmmDJVmuemKjxePKQNSCUvA==";

// Authentication route
router.post("/auth", authenticateUser, (req, res) => {
  // Send the authentication data back to the client if needed
  res.status(200).json(req.authData);
});

router.get("/getRemoteFiles", async (req, res) => {
    try {
      const files = await connectToFileShare(); // Get the list of files
      res.status(200).json({ files }); // Send the files as JSON response
    } catch (error) {
      res.status(500).json({ error: error.message }); // Handle errors
    }
  });


  router.get("/readFile/:fileName", async (req, res) => {
    const { fileName } = req.params;
  
    try {
      if (fileName.includes("..") || fileName.includes("/")) {
        return res.status(400).json({ error: "Invalid file name." });
      }
  
      const shareName = "applworking"; // Replace with your file share name
      const targetFolderName = "SaaSMigrationFiles"; // The folder you want to target
      const filePath = `${shareName}/${encodeURIComponent(targetFolderName)}/${encodeURIComponent(fileName)}`;
  
      const fileClient = await getFileClient(fileName);
  
      // Check if the file exists
      await fileClient.getProperties();
  
      // Download the file content
      const downloadResponse = await fileClient.download();
  
      // Set headers for file download
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", downloadResponse.contentType || "application/octet-stream");
  
      // Pipe the file content directly to the response
      downloadResponse.readableStreamBody.pipe(res);
    } catch (error) {
      console.error("Error reading file:", error);
      res.status(500).json({ error: "An error occurred while reading the file." });
    }
  });


// Helper function to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}

// Create a ShareServiceClient
const serviceClient = new ShareServiceClient(
  `https://${account}.file.core.windows.net`,
  new StorageSharedKeyCredential(account, accountKey)
);

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// POST API to upload an Excel file
router.post("/downloadFile", upload.single("file"), async (req, res) => {
  const file = req.file;
  console.log("File received:", file);
  if (!file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const shareName = "applworking"; // Replace with your file share name
    const parentFolderName = "SaaSMigrationFiles"; // Parent folder
    const newFolderName = `Document_${Date.now()}`; // Unique folder name
    const directoryClient = serviceClient
      .getShareClient(shareName)
      .getDirectoryClient(parentFolderName)
      .getDirectoryClient(newFolderName);

    // Create the new folder
    await directoryClient.create();
    console.log(`Created folder: ${newFolderName}`);

    // Upload the file to the new folder
    const fileClient = directoryClient.getFileClient(file.originalname);
    await fileClient.create(file.buffer.length);
    await fileClient.uploadRange(file.buffer, 0, file.buffer.length);

    console.log(`Uploaded file: ${file.originalname} to folder: ${newFolderName}`);
    res.status(200).json({
      message: "File uploaded successfully.",
      folderName: newFolderName,
      fileName: file.originalname,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "An error occurred while uploading the file." });
  }
});

export default router;
