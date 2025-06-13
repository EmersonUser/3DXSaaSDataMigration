import {
  readExcelFile,
  uploadFile,
} from "../utils/utilsParts.js";
import {
    createMfgInstance,
    extractChildConnections,
    searchProduct,
    updateMfgInstance,
} from "../service/mbom.service.js";
import { authenticateUser } from "../auth/authorizationService.js";


// Controller for EBOM connection
export const mbomConnection = async (req, res) => {
  const {authData} = await authenticateUser(req, res);
    try {
      // Upload the file
      const file = await uploadFile(req, res);
      const { path: filePath } = file;
      // Convert Excel to JSON
      const jsonData = await readExcelFile(filePath);

      const resultData = [];
          
      for (const item of jsonData) {
        let statusMessage = "";

      // Search Parent Product and Child Product
      const search = await searchProduct(authData, item);
      statusMessage = search.status;
      const parentData = search?.data?.parent;
      const parentId = parentData?.id || null;
      const childData = search?.data?.child;
      const childId = childData?.id || null;

    // Check Child Connection Status
    let isChildConnected = false;
    if (parentId && childId) {
        const result = await extractChildConnections(authData, parentId, childId);
        statusMessage = result.status;
        isChildConnected = result.isChildConnected;

        // Call API to connect Parent and Child
        if (!isChildConnected) {
            const result = await createMfgInstance(authData, parentId, childId);
            statusMessage = result.status;
            const engInstance = result?.data?.member?.[0];
            const patching = await updateMfgInstance(authData, parentId, engInstance, item);
        }
    }

    resultData.push({ ...item, Status: statusMessage || "No status available" });
    }

    res.send(resultData);

    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred during the EBOM connection"
      });
    }
};