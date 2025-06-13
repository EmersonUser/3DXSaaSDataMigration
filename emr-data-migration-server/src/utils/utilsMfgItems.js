import{
  searchMfgItem,
} from "../service/searchMfgItem.service.js"
import{
  searchEngItem,
} from "../service/searchEngItem.service.js"
import{
  classifyItem,
  getCestamp,
  updateItem,
} from "../service/classifyMfgItem.service.js"


import {
  filterHighestState,
  checkSearchError,
} from "../utils/utilsParts.js";


/**
 * Format unmatched items for product creation.
 * @param {Array} unmatched - Array of unmatched product items.
 * @returns {Object} - Formatted object with required attributes for unmatched items.
 */
export const formatUnmatchedItems = (unmatched) => {
  const createdres = {
    items: unmatched?.map((item) => ({
        type: "CreateAssembly",
        attributes: {
            title: item.Title,
            description: item.Description,
        /*"dsmfg:MfgEnterpriseAttributes": {
          EMR_ERP_LongDescription: item["Long Description"],
          EMR_ERP_PrimaryUOM: item["Unit of Measure"],
          Comments: item.Comments,
        },
        "dsmfg:EnterpriseReference": {
          partNumber: item.Name,
        },*/
      },
    })),
  };
  return createdres;
};



/**
 * Format unmatched items for product creation.
 * @param {Array} unmatched - Array of unmatched product items.
 * @returns {Object} - Formatted object with required attributes for unmatched items.
 */
export const formatEnggItemsToCreateScope = (idEnggItem) => {
  const createdres = {
    identifier: idEnggItem,
    source: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
    relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${idEnggItem}`,
    type: "VPMReference",
    syncEIN: true,
  };

  return createdres;
};




export const searchMfgItems = async (authData, jsonData) => {
  const ErrorMfgParts = [];
  try {
    const { matchedMfg, unmatchedMfg, customMfgValue, customMfgSearchedData } =
      await searchMfgItem(authData, jsonData); 
    return { matchedMfg, unmatchedMfg, customMfgValue, customMfgSearchedData };
  } catch (error) {
    ErrorMfgParts.push("facing issue with searchWS");
    console.error(`Error searching for Mfg item with title":`, error);
  }
};

export const searchEngItems = async (authData, jsonData) => {
  const ErrorMfgParts = [];
  try {
    const { matched, unmatched, customValue, customSearchedData } =
      await searchEngItem(authData, jsonData); 
    return { matched, unmatched, customValue, customSearchedData };
  } catch (error) {
    ErrorMfgParts.push("facing issue with searchWS");
    console.error(`Error searching for Mfg item with title":`, error);
  }
};


// Find highest revision based on ASCII (assuming string revs like "AA", "AB", etc.)
export const filterMfgHighestState = (array) => {
  return array.reduce((highest, current) => {
    return !highest || current.revision > highest.revision ? current : highest;
  }, null);
};

// Check if highest revision is less than the one in jsonData
export const checkMfgSearchError = (val, arr) => {
  let ErrorMsg = [];
  for (let i = 0; i < arr.length; i++) {
    if (val.title === arr[i]["Title"]) {
      if (val.revision < arr[i]["Spec Rev"]) {
        ErrorMsg.push({
          id: arr[i]["Title"],
          message: `${arr[i]["Title"]} Given revision is greater than Search Revision`,
        });
      }
    }
  }
  return ErrorMsg;
};


export const classifyItems = async (authData, attr, classId, idEnggItem) => {
  const payload = {
    ClassID: classId,
    ObjectsToClassify: [
      {
        source: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
        type: "VPMReference",
        identifier: idEnggItem,
        relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${idEnggItem}`,
      },
    ],
  };
  const resClassifyItem = await classifyItem(authData, payload);
  
  const cestamp = await getCestamp (authData, idEnggItem);
console.log("cestamp = ",cestamp);
const updatePayload = [{
        referencedObject: {
            source: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
            type: "dslib:ClassifiedItem",
            identifier: idEnggItem,
            relativePath: `resources/v1/modeler/dslib/dslib:ClassifiedItem/${idEnggItem}`,
        },
        attributes: {
          cestamp: cestamp,
          [`${attr.plantName}OracleTemplate`]: attr.OracleTemplate,
          [`${attr.plantName}PlantId`]: "Test",
          [`${attr.plantName}PlantStatus`]: "Test",
          [`${attr.plantName}ERPStatus`]: attr.ERPStatus,
          [`${attr.plantName}ERPExport`]: attr.ERPExport,
      }
    },];

  const resUpdateItem = await updateItem(authData, updatePayload);
  return {
    resClassifyItem: resClassifyItem,
    resUpdateItem: resUpdateItem
  };
};