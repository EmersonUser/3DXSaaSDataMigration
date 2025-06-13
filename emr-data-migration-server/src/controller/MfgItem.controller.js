import { readExcelFile, uploadFile, reviseService, findLibraryID } from "../service/index.js";
import {
  formatUnmatchedItems,
  formatEnggItemsToCreateScope,
  searchMfgItems,
  searchEngItems,
  filterMfgHighestState,
  checkMfgSearchError,
  classifyItems,
} from "../utils/utilsMfgItems.js";

import { createMfgItem } from "../service/createMfgItem.service.js";
import { createScopeBetweenEnggAndMfgItem } from "../service/createScopeLink.service.js";
import { transferOwnership } from "../service/transferOwnership.service.js";
import { authenticateUser } from "../auth/authorizationService.js";
import { getScopedEngItem } from "../service/getscopedEngItem.service.js";
import { disconnectOldScopedEngItem } from "../service/disconnectScopeLink.service.js";
import { promoteObject } from "../service/promoteObject.service.js";
import { deleteMfgItem } from "../service/deleteMfgItem.service.js";
import { getMfgItem } from "../service/getMfgItem.service.js";

export const manufacturingitem = async (req, res) => {
  const authData = await authenticateUser(req, res);
  try {
    const file = await uploadFile(req, res);
    const { path: filePath } = file;

    const jsonData = await readExcelFile(filePath);

    const searchData = await searchEngItems(authData.authData, jsonData);
    let { matched, unmatched, customValue, customSearchedData } = searchData;
    let resReviseMfgItem = null;
    let createMfgItemWS = [];
    let idsToTransferOwnership = [];
    let resCreateScopeLinkAndPromote = [];
    let resScopedEngitem = [];
    let resDetachOldScope = [];
    let resCreateRevScopeAndPromote = [];
    let reviseMfgItemWS = [];
    let createCustomMfgItemWS = [];
    let createCustomScopeLinkAndPromoteWS = [];
    let promoteCustomMfgResponseWS = [];
    let reviseCustomMfgItemWS = [];
    let createScopeLinkAndPromoteWS = [];
    let detachOldScopeWS = [];
    let createRevScopeLinkAndPromoteWS = [];
    let getOldScopeOfNewRevWS = [];
    let classifyItemCreateWS = [];
    let classifyItemReviseWS = [];
    let classifyItemCustomWS = [];

    const resSearchMfgData = await searchMfgItems(authData.authData, jsonData);
    let {
      matchedMfg = [],
      unmatchedMfg = [],
      customMfgValue = [],
      customMfgSearchedData = [],
    } = resSearchMfgData || {};
    
    //Create Mfg item if does not exist
    if (unmatchedMfg && unmatchedMfg.length > 0) {
      for (const item of unmatchedMfg) {
        const createReqData = await formatUnmatchedItems([item]);
        const resCreateMfg = await createMfgItem(
          authData.authData,
          createReqData
        );
        createMfgItemWS.push(resCreateMfg);
        // Check if engineering part exist with same title
        if (
          (resCreateMfg.member && 
          resCreateMfg.member.length > 0 &&
          resCreateMfg.totalItems !== undefined
            ? resCreateMfg.totalItems
            : null) === 1
        ) {
          const { title, revision } = resCreateMfg.member[0];
          let matchedEngObject = null;
          for (const group of matched) {
            matchedEngObject = group.find(
              (obj) => item["Engineering Item Name"] === obj.title && item["Engineering Item Revision"] === obj.revision
            );
            if (matchedEngObject) break;
          }

          if (matchedEngObject) {
            const idEnggItem = matchedEngObject.id;
            const idMfgItem = resCreateMfg?.member?.[0]?.id;
            const reqBodyToCreateScope = await formatEnggItemsToCreateScope(
              idEnggItem
            );

            let resCreateScopeLinkAndPromote =
              await createScopeBetweenEnggAndMfgItem(
                authData.authData,
                reqBodyToCreateScope,
                idMfgItem
              );
            
            if (item) {
              const attr = {
                "OracleTemplate": item["MMI Oracle Template"],
                "ERPStatus": item["ERP Status"],
                "ERPExport": item["FSG ERP Export"],
                "plantName": item["Plant Name"],
              };

              const libraryDetails = await findLibraryID(authData.authData);
              if (libraryDetails?.member) {
                const classId =
                  libraryDetails?.member?.[0]?.ChildClasses?.member
                    ?.find((itm) =>
                      itm?.ChildClasses?.member?.some(
                        (child) =>
                          child?.title === item["Plant Name"]
                      )
                    )
                    ?.ChildClasses?.member?.find(
                      (child) =>
                        child?.title === item["Plant Name"]
                    )?.id;
                const resClassifyAndUpdateObject = await classifyItems(authData.authData, attr, classId, idEnggItem);
                if(resClassifyAndUpdateObject){
                  classifyItemCreateWS.push("Success: Classify & update");
                }else{
                  classifyItemCreateWS.push("Failure: Classify & update");
                }
              }
            } else {
              classifyItemCreateWS.push("Failure: Classify & update");
            }
            createScopeLinkAndPromoteWS.push(resCreateScopeLinkAndPromote);
            idsToTransferOwnership.push(resCreateMfg?.member?.[0]?.id);
          } else {
            createScopeLinkAndPromoteWS.push(
              `Failure: ${item?.Title} ${item["Spec Rev"]} Engineering part does NOT exist to create the scope.`
            );
            classifyItemCreateWS.push("Failure: Classify & update");
          }
        }
      }
    }
    // Revise Mfg item if already exists
    if (matchedMfg && matchedMfg.length > 0) {
      for (const item of matchedMfg) {
        let highestRelease = [];
        if (item?.length >= 1) {
          highestRelease = filterMfgHighestState(item);
        }

        const matchedJsonData = jsonData.filter(
          (itm) =>
            itm.Title === highestRelease.title &&
            itm?.["Spec Rev"] !== highestRelease.revision
        );
        
        if (Array.isArray(matchedJsonData) && matchedJsonData.length > 0) {
          resReviseMfgItem = await reviseService(
            authData.authData,
            [highestRelease],
            [matchedJsonData],
            true
          );
          reviseMfgItemWS.push(resReviseMfgItem);
          const revisedResults = resReviseMfgItem?.[0]?.results || [];
          let revisedMfgId = null;
          // Prefer result[1] if it has a valid revision, otherwise fallback to result[0]
          if (revisedResults[1]?.revision) {
            revisedMfgId = revisedResults[1]?.physicalid;
          } else if (revisedResults[0]?.revision) {
            revisedMfgId = revisedResults[0]?.physicalid;
          }
          let resScopedEngitem = await getScopedEngItem(
            authData.authData,
            revisedMfgId
          );
          getOldScopeOfNewRevWS.push(resScopedEngitem);
          const scopedEngItemObject = resScopedEngitem?.member[0]?.ScopeEngItem;

          const resRevisedMfgItemDetails = await getMfgItem(
            authData.authData,
            revisedMfgId
          );
          
          const { title, revision } = resRevisedMfgItemDetails[0];
          
          let match = null;
          for (const data of matchedJsonData) {
            for (const group of matched) {
              match = group.find(
                (itm) =>
                  itm.title === data["Engineering Item Name"] &&
                  itm.revision === data["Engineering Item Revision"]
              );
              if (match) break;
            }
          }
          
          if (match) {
            const idEnggItem = match ? match.id : null;
            if(scopedEngItemObject){
              let resDetachOldScope = await disconnectOldScopedEngItem(
                authData.authData,
                scopedEngItemObject,
                revisedMfgId
              );
              detachOldScopeWS.push(resDetachOldScope);
            }

            // Classify physical product
            const plantObj = jsonData.find(
               (item) => item["Title"] === title && item["Spec Rev"] == revision
             );
             
            if (plantObj) {
              const attr = {
                "OracleTemplate": plantObj["MMI Oracle Template"],
                "ERPStatus": plantObj["ERP Status"],
                "ERPExport": plantObj["FSG ERP Export"],
                "plantName": plantObj["Plant Name"],
              };
              
              const libraryDetails = await findLibraryID(authData.authData);
              if (libraryDetails?.member) {
                const classId =
                libraryDetails?.member?.[0]?.ChildClasses?.member
                  ?.find((itm) =>
                    itm?.ChildClasses?.member?.some(
                      (child) =>
                        child?.title === plantObj["Plant Name"]
                    )
                  )
                  ?.ChildClasses?.member?.find(
                    (child) =>
                      child?.title === plantObj["Plant Name"]
                  )?.id;

                const resClassifyAndUpdateObject = await classifyItems(authData.authData, attr, classId, idEnggItem);
 
                if(resClassifyAndUpdateObject){
                  classifyItemReviseWS.push("Success: Classify & update");
                }else{
                  classifyItemReviseWS.push("Failure: Classify & update");
                }
              }
            } else {
              classifyItemReviseWS.push("Failure: Classify & update");
            }

            const reqBodyToCreateScope = await formatEnggItemsToCreateScope(
              idEnggItem
            );

            resCreateRevScopeAndPromote =
              await createScopeBetweenEnggAndMfgItem(
                authData.authData,
                reqBodyToCreateScope,
                revisedMfgId
              );

            createRevScopeLinkAndPromoteWS.push(resCreateRevScopeAndPromote);
            idsToTransferOwnership.push(revisedMfgId);
          } else {
            createRevScopeLinkAndPromoteWS.push(
              `Failure: ${title} ${revision} Engineering part does NOT exist to create the scope.`
            );
            classifyItemReviseWS.push("Failure: Classify & update");
          }
        } else {
          reviseMfgItemWS.push(
            `Failure: ${item.title} Mfg item with the provided revision already exist or Some discrepancy found in title & revision.`
          );
          getOldScopeOfNewRevWS.push("Old scope not retrived");
          detachOldScopeWS.push("Old scope not detached");
          createRevScopeLinkAndPromoteWS.push(
            "Failure: New scope link is NOT created and object NOT promoted."
          );
          classifyItemReviseWS.push("Failure: Classify & update");
        }
      }
    }

    if (customMfgValue && customMfgValue.length > 0) {
      for (const item of customMfgValue) {
        const createCustomReqData = await formatUnmatchedItems([item]); // Process one item at a time
        const resCustomCreateMfg = await createMfgItem(
          authData.authData,
          createCustomReqData
        );

        createCustomMfgItemWS.push(resCustomCreateMfg);
        const idMfgItem = resCustomCreateMfg?.member?.[0]?.id;

        const promoteCustomMfgResponse = await promoteObject(
          authData.authData,
          [{ physicalid: idMfgItem }]
        );
        promoteCustomMfgResponseWS.push(promoteCustomMfgResponse);
        const resCustomReviseMfgItem = await reviseService(
          authData.authData,
          resCustomCreateMfg?.member,
          [item],
          true
        );
        const status = resCustomReviseMfgItem?.[0]?.status || "Failure";
        reviseCustomMfgItemWS.push(status);
        const customRevisedResults = resCustomReviseMfgItem?.[0]?.results || [];

        let customRevisedMfgId = null;
        // Prefer result[1] if it has a valid revision, otherwise fallback to result[0]
        if (customRevisedResults[1]?.revision) {
          customRevisedMfgId = customRevisedResults[1]?.physicalid;
        } else if (customRevisedResults[0]?.revision) {
          customRevisedMfgId = customRevisedResults[0]?.physicalid;
        }

        // Check if engineering part exist with same title & rev
        if (
          (resCustomCreateMfg.member &&
          resCustomCreateMfg.member.length > 0 &&
          resCustomCreateMfg.totalItems !== undefined
            ? resCustomCreateMfg.totalItems
            : null) === 1
        ) {
          const resCustomRevMfgItemDetails = await getMfgItem(
            authData.authData,
            customRevisedMfgId
          );

          const resCustomRevMfgItem = resCustomRevMfgItemDetails[0]; // since it always has one object

          let matchedItem;

          for (const group of customSearchedData) {
            matchedItem = group.find(
              (itm) =>
                itm.title === item["Engineering Item Name"] &&
                itm.revision === item["Engineering Item Revision"]
            );
            if (matchedItem) break; // stop if found
          }

          if (matchedItem) {
            const idEnggItem = matchedItem?.id;
            const reqBodyToCreateScope = await formatEnggItemsToCreateScope(
              idEnggItem
            );

            // Classify physical product
            // const plantObj = jsonData.find(
            //   (item) => item["Title"] === resCustomRevMfgItem.title && item["Spec Rev"] === resCustomRevMfgItem.revision
            // );

            if (item) {
              const attr = {
                "OracleTemplate": item["MMI Oracle Template"],
                "ERPStatus": item["ERP Status"],
                "ERPExport": item["FSG ERP Export"],
                "plantName": item["Plant Name"],
              };

              const libraryDetails = await findLibraryID(authData.authData);
              if (libraryDetails?.member) {
                const classId =
                  libraryDetails?.member?.[0]?.ChildClasses?.member
                    ?.find((itm) =>
                      itm?.ChildClasses?.member?.some(
                        (child) =>
                          child?.title === item["Plant Name"]
                      )
                    )
                    ?.ChildClasses?.member?.find(
                      (child) =>
                        child?.title === item["Plant Name"]
                    )?.id;

                const resClassifyAndUpdateObject = await classifyItems(authData.authData, attr, classId, idEnggItem);

                if(resClassifyAndUpdateObject){
                  classifyItemCustomWS.push("Success: Classify & update");
                }else{
                  classifyItemCustomWS.push("Failure: Classify & update");
                }
              }
            } else {
              classifyItemCustomWS.push("Failure: Classify & update");
            }

            let resCreateScopeLinkAndPromote =
              await createScopeBetweenEnggAndMfgItem(
                authData.authData,
                reqBodyToCreateScope,
                customRevisedMfgId
              );
            createCustomScopeLinkAndPromoteWS.push(
              resCreateScopeLinkAndPromote
            );
            idsToTransferOwnership.push(resCustomCreateMfg?.member?.[0]?.id);
          } else {
            createCustomScopeLinkAndPromoteWS.push(
              `Failure: ${item?.Title}  ${item["Spec Rev"]} Engineering part does NOT exist to create the scope.`
            );
            classifyItemCustomWS.push("Failure: Classify & update");
          }
        }
        const resDeleteMfgItem = await deleteMfgItem(
          authData.authData,
          idMfgItem
        );
      }
    }

    //const respOwnershipTransfer = transferOwnership(authData.authData, idsToTransferOwnership, "amit.sonje1", "Company Name", "ISV-Butterfly Valves")

    const resultData = {
      searchMfgItemWS: resSearchMfgData,
      createMfgItemWS: createMfgItemWS,
      createScopeLinkAndPromoteWS: createScopeLinkAndPromoteWS,
      ReviseMfgItemWS: reviseMfgItemWS,
      createRevScopeLinkAndPromoteWS: createRevScopeLinkAndPromoteWS,
      reviseCustomMfgItemWS: reviseCustomMfgItemWS,
      createCustomScopeLinkAndPromoteWS: createCustomScopeLinkAndPromoteWS,
      classifyItmCreateWS: classifyItemCreateWS,
      classifyItmReviseWS: classifyItemReviseWS,
      classifyItmCustomWS: classifyItemCustomWS,
      jsonDataWS: jsonData,
    };
    res.status(200).json(resultData);
  } catch (error) {
    console.error("Error in Mfg Item:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
