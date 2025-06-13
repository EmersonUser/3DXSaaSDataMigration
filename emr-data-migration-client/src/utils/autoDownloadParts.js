import ExcelJS from "exceljs";
export const generateExcelPart = async (jsonData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data");

  // Define the columns for the sheet
  sheet.columns = [
    { header: "IsType", key: "istype", width: 25 },
    { header: "Name", key: "name", width: 25 },
    { header: "Title", key: "title", width: 25 },
    { header: "Description", key: "description", width: 25 },
    { header: "ID", key: "id", width: 35 },
    { header: "Created State of Migration", key: "created", width: 50 },
    { header: "Promoted State of Migration", key: "maturitystatus", width: 50 },
    { header: "Revise State of Migration", key: "revise_status", width: 50 },
    { header: "Revised Id", key: "revise_id", width: 35 },
    { header: "Owner", key: "owner", width: 20 },
    { header: "Organization", key: "organization", width: 20 },
    { header: "Collabspace", key: "collabspace", width: 25 },
    { header: "Cestamp", key: "cestamp", width: 35 },
  ];

  const rows = [];

  // Handling customCreationRevision
  if (
    jsonData?.customCreationRevision?.created?.length > 0 &&
    jsonData?.customCreationRevision?.revised?.results?.length > 0 &&
    jsonData?.customCreationRevision?.promate?.results?.length > 0
  ) {
    const createdItems = jsonData.customCreationRevision.created;
    const revisedItems = jsonData.customCreationRevision.revised.results;
    const promateItems = jsonData.customCreationRevision.promate.results;

    createdItems.forEach((createdItem, index) => {
      const revisedItem = revisedItems[index] || {}; // Match by index or use an empty object
      const promateItem = promateItems[index] || {}; // Match by index or use an empty object

      rows.push({
        istype: "custom",
        name: createdItem?.name || "",
        title: createdItem?.title || "",
        Type: "Fastener",
        id: createdItem?.id || "",
        created: "success",
        owner: createdItem?.owner || "",
        description: createdItem?.description || "",
        collabspace: createdItem?.collabspace || "",
        cestamp: createdItem?.cestamp || "",
        organization: createdItem?.organization || "",
        revise_status: "success",
        revise_id: revisedItem?.physicalid || "",
        maturitystatus: promateItem?.maturityState || "",
      });
    });
  }

  // Handling allRevisionParts
  if (jsonData?.allRevisionParts?.searched?.length > 0) {
    console.log("coming for revision");
    const searchedItems = jsonData?.allRevisionParts?.searched || []; // Items that were searched
    const revisedItems = jsonData?.allRevisionParts?.revised?.results || []; // Revised items
    const promateRevisedItems =
      jsonData?.allRevisionParts?.revised?.results || []; // Promotion items for revision

    // Iterate through the searched items
    searchedItems.forEach((searchedItem, index) => {
      const revisedItem = revisedItems[index] || {}; // Match by index or use an empty object
      const promateRevisedItem = promateRevisedItems[index] || {}; // Match by index or use an empty object

      rows.push({
        istype: "revised",
        name: searchedItem?.name || "",
        title: searchedItem?.title || "",
        Type: searchedItem?.type || "VPMReference",
        id: searchedItem?.id || "",
        created: "already created",
        modified: searchedItem?.modified || "",
        revision: searchedItem?.revision || "",
        state: searchedItem?.state || "RELEASED",
        owner: searchedItem?.owner || "",
        description: searchedItem?.description || "",
        collabspace: searchedItem?.collabspace || "",
        cestamp: searchedItem?.cestamp || "",
        organization: searchedItem?.organization || "",
        revise_status: revisedItem?.revision ? "success" : "failed", // Status based on revision availability
        revise_id: revisedItem?.versionid || "", // Use version ID for revised items
        maturitystatus: promateRevisedItem?.revision || "", // Assuming maturityState is part of the revision object
      });
    });
  }

  //handling all created
  if (jsonData?.allCreatedpart?.created?.length > 0) {
    console.log("coming for normal create");
    const creatednormalItems = jsonData?.allCreatedpart?.created;
    const promatenormalItems =
      jsonData?.allCreatedpart?.promated?.results.results || []; // Ensure it defaults to empty array

    creatednormalItems.forEach((creatednormalItem, index) => {
      const promatenormItem = promatenormalItems[index] || {}; // Match by index or use an empty object

      rows.push({
        istype: "created",
        name: creatednormalItem?.name || "",
        title: creatednormalItem?.title || "",
        Type: "Fastener",
        id: creatednormalItem?.id || "",
        created: "success",
        owner: creatednormalItem?.owner || "",
        description: creatednormalItem?.description || "",
        collabspace: creatednormalItem?.collabspace || "",
        cestamp: creatednormalItem?.cestamp || "",
        organization: creatednormalItem?.organization || "",
        revise_status: "failed",
        revise_id: "need to call for revision scenario",
        maturitystatus: promatenormItem?.maturityState || "",
      });
    });
  }

  // Add rows to the sheet
  rows.forEach((row) => {
    sheet.addRow(row);
  });

  // Return the buffer of the workbook
  return await workbook.xlsx.writeBuffer();
};