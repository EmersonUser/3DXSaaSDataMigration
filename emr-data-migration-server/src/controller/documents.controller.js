import path from "path";
import os from "os";
import axios from "axios";
import axiosRetry from "axios-retry";
import pLimit from "p-limit";
import { readExcelFile, multipleUpload } from "../utils/utilsParts.js";
import { authenticateUser } from "../auth/authorizationService.js";
import {
  createDocumentCopy,
  findLibraryID,
  classifyItems,
  promoteObject,
  removeCircularReferences,
  reviseService,
} from "../service/index.js";
import { searchCustomDocuments } from "./customDocument.controller.js";
import {
  setupAxiosRetry,
  processTitlesWithThrottling,
  parseSearchResults,
  getTicketTokens,
  flattenJSON,
  categorizeTitlesAndParts,
  exceltoJsonConversion,
  chunkArray,
} from "../utils/documentsUtils.js";

export const searchDocuments = async (req, res) => {
  try {
    let customTypeData = [];
    let combinedData = {};
    const authData = await authenticateUser(req, res);
    const uploadedFiles = await multipleUpload(req, res);
    const { path: filePath } = uploadedFiles[0];
    const jsonData = await readExcelFile(filePath);
    req.jsonData = jsonData;

    const { titlesAndPartDetails = [], titlesAndPartDetailsCustomType = [] } =
      categorizeTitlesAndParts(jsonData);

    // Set up retry logic for axios
    setupAxiosRetry();

    const limit = pLimit(2); // Limit to 3 concurrent requests

    if (titlesAndPartDetailsCustomType.length > 0) {
      const customDocumentResponse = await searchCustomDocuments(
        req,
        titlesAndPartDetailsCustomType,
        uploadedFiles,
        jsonData
      );
      customTypeData = customDocumentResponse;
    }

    if (titlesAndPartDetails.length > 0) {
      const titleExistence = await processTitlesWithThrottling(
        req,
        titlesAndPartDetails,
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

      if (nonExistentTitles.length > 0) {
        const ticketTokenChunks = chunkArray(
          await getTicketTokens(jsonData, uploadedFiles, authData),
          50
        );

        if (ticketTokenChunks.length > 0) {
          const titleChunks = chunkArray(nonExistentTitles, 50);
          // Process document copy creation with controlled concurrency
          const createDocumentCopyResponses = await Promise.all(
            titleChunks.map((chunk, index) =>
              limit(() => {
                const tokens = ticketTokenChunks[index] || [];
                console.log(
                  `Processing chunk ${index + 1} of ${titleChunks.length}`
                );
                return createDocumentCopy(
                  authData.authData,
                  chunk,
                  tokens,
                  uploadedFiles
                );
              })
            )
          );

          createDocumentCopyData = createDocumentCopyResponses.flatMap(
            (response) => response?.data || []
          );
          console.log("createDocumentCopyData", createDocumentCopyData);
          const findLibraryIDData = await findLibraryID(authData.authData);
          if (findLibraryIDData?.member) {
            const dataChunks = chunkArray(createDocumentCopyData, 50);
            // Process classify items with controlled concurrency
            classifyItemsResponse = await Promise.all(
              dataChunks.map((chunk) =>
                limit(() =>
                  classifyItems(
                    authData.authData,
                    chunk,
                    findLibraryIDData.member
                  )
                )
              )
            );
          }
          console.log("classifyItemsResponse........", classifyItemsResponse);
          const promoteChunks = chunkArray(createDocumentCopyData, 50);
          // Process promote objects with controlled concurrency
          promoteObjects = await Promise.all(
            promoteChunks.map((chunk) =>
              limit(() => promoteObject(authData.authData, chunk))
            )
          );
        }
      }
      console.log("promoteObjects........", promoteObjects);
      if (existentTitles.length > 0 && collectiveSearchData.length > 0) {
        const reviseChunks = chunkArray(collectiveSearchData, 50);

        // Process revise service with controlled concurrency
        reviseData = await Promise.all(
          reviseChunks.map((chunk) =>
            limit(() => reviseService(authData.authData, chunk, jsonData))
          )
        );
      }

      const sanitizedJsonData = await removeCircularReferences(jsonData);
      collectiveSearchData.unshift({
        searchedItems: collectiveSearchData.length,
        searchedProductsData: productSearchData,
      });

      const collecitveResponse = {
        jsonData: sanitizedJsonData,
        searchData: collectiveSearchData,
        createDocument: createDocumentCopyData,
        classifyItems: classifyItemsResponse,
        promatedObjects: promoteObjects,
        reviseData: reviseData,
      };
      combinedData = {
        ...collecitveResponse,
      };
    }

    // Send the response with the search results
    combinedData.customTypeData = customTypeData;
    res.status(200).json(combinedData);
  } catch (error) {
    console.error("Error in document:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
