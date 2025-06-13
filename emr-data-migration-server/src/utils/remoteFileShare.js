import express from "express";
import {
  ShareServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-file-share"; // Correct import

const app = express();
// Middleware
app.use(express.json());

// Replace with your Azure Storage account name and key
const account = "plmsharedrive";
const accountKey =
  "PSeSrmysg5IhgGpTUVtYghSeQYVvryT1pseUSAfbBtiqFsW404vBqqn8Eih4V90nmmDJVmuemKjxePKQNSCUvA==";

// Create a ShareServiceClient
const serviceClient = new ShareServiceClient(
  `https://${account}.file.core.windows.net`,
  new StorageSharedKeyCredential(account, accountKey) // Correct usage
);

async function listShares() {
  let i = 1;
  // for await (const share of serviceClient.listShares()) {
  //     console.log(`Share ${i++}: ${share.name}`);
  // }
}

export async function getFileClient(fileName) {
  const shareName = "applworking"; // Replace with your file share name
  const targetFolderName = "SaaSMigrationFiles"; // The folder you want to target
  const directoryClient = serviceClient
    .getShareClient(shareName)
    .getDirectoryClient(targetFolderName);

  try {
    // Get the FileClient for the specific file
    const fileClient = directoryClient.getFileClient(fileName);
    return fileClient;
  } catch (error) {
    console.error(`Error getting FileClient for ${fileName}: ${error.message}`);
    throw error;
  }
}

// Example usage of the listShares function
export async function connectToFileShare() {
  const shareName = "applworking"; // Replace with your file share name
  const targetFolderName = "SaaSMigrationFiles"; // The folder you want to target
  const directoryClient = serviceClient
    .getShareClient(shareName)
    .getDirectoryClient(targetFolderName);

  try {
    // Check if the target folder exists
    await directoryClient.getProperties();
    console.log(`Connected to folder: ${targetFolderName}`);

    const files = [];
    // List all files in the target folder
    for await (const item of directoryClient.listFilesAndDirectories()) {
      if (item.kind === "file") {
        files.push(item.name); // Collect file names
      }
    }
    return files; // Return the list of files
  } catch (error) {
    console.error(
      `Error accessing folder ${targetFolderName}: ${error.message}`
    );
    throw error; // Throw the error to handle it in the route
  }
}

// connectToFileShare()
listShares().catch((err) => {
  console.error("Error running sample:", err.message);
});
