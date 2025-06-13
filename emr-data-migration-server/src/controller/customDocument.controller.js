import os from "os";
import axios from "axios";
import axiosRetry from "axios-retry";
import pLimit from "p-limit";
import { authenticateUser } from "../auth/authorizationService.js";
import {
  createDocumentCopy,
  findLibraryID,
  classifyItems,
  promoteObject,
  reviseService,
  deleteLastRevisedDocument,
} from "../service/index.js";
import {
  setupAxiosRetry,
  processTitlesWithThrottling,
  parseSearchResults,
  getTicketTokens,
  flattenJSON,
} from "../utils/documentsUtils.js";

export const searchCustomDocuments = async (
  req,
  customTypeData,
  uploadedFiles,
  jsonData,
  res
) => {
  try {
    const authData = await authenticateUser(req, res);
    // Set up retry logic for axios
    setupAxiosRetry();

    const cpuCount = os.cpus().length;
    const limit = pLimit(cpuCount);
    console.log(`🧠 Using ${cpuCount} CPU cores for concurrency control.`);

    const titleExistence = await processTitlesWithThrottling(
      req,
      customTypeData,
      limit,
      authData
    );

    const {
      existentTitles,
      nonExistentTitles,
      collectiveSearchData,
      productSearchData,
    } = parseSearchResults(titleExistence);

    let createDocumentCopyData = [];
    let classifyItemsResponse = [];
    let promoteObjects = [];
    let reviseData = [];
    let deletedDocuments = [];
    let existingDocuments = [];
    if (existentTitles.length > 0) {
      existentTitles.forEach((title) => {
        existingDocuments.push({
          message: `Document already exists with title ${title}`,
        });
      });
    }
    if (nonExistentTitles.length > 0) {
      const ticketTokens = await getTicketTokens(
        jsonData,
        uploadedFiles,
        authData
      );

      if (ticketTokens?.length > 0) {
        const createDocumentCopyResponse = await createDocumentCopy(
          authData.authData,
          nonExistentTitles,
          ticketTokens,
          uploadedFiles
        );

        if (createDocumentCopyResponse?.data) {
          createDocumentCopyData = flattenJSON(
            createDocumentCopyResponse?.data
          );
          promoteObjects = await promoteObject(
            authData.authData,
            createDocumentCopyResponse?.data
          );
        }
      }
      reviseData = await reviseService(
        authData.authData,
        createDocumentCopyData,
        jsonData
      );

      const deleteResponses = await Promise.all(
        createDocumentCopyData.map(async ({ id }) => {
          try {
            return await deleteLastRevisedDocument(authData.authData, id);
          } catch (error) {
            console.error(
              `Failed to delete document with ID: ${data.id}`,
              error.message
            );
            return { error: error.message, id: data.id };
          }
        })
      );
      deletedDocuments = deleteResponses;
      const findLibraryIDData = await findLibraryID(authData.authData);
      if (findLibraryIDData?.member) {
        classifyItemsResponse = await classifyItems(
          authData.authData,
          reviseData[0]?.results,
          findLibraryIDData.member,
          true
        );
      }
      collectiveSearchData.unshift({
        searchedItems: collectiveSearchData.length,
        searchedProductsData: productSearchData,
      });
    }
    const combinedData = {
      searchData: collectiveSearchData,
      existingDocuments: existingDocuments,
      createDocument: createDocumentCopyData,
      promatedObjects: promoteObjects,
      reviseData: reviseData,
      deletedDocuments: deletedDocuments,
      classifyItems: classifyItemsResponse,
    };

    return combinedData;
  } catch (error) {
    console.error("Error in custom document:", error.message);
  }
};
