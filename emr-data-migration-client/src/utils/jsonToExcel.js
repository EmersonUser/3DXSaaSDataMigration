import ExcelJS from "exceljs";

export const generateExcel = async (jsonResponse) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data");

  // Define the columns for the sheet
  sheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Title", key: "title", width: 25 },
    { header: "Description", key: "description", width: 25 },
    { header: "ID", key: "id", width: 35 },
    { header: "Created State of Migration", key: "created", width: 50 },
    { header: "Promated State of Migration", key: "maturitystatus", width: 50 },
    { header: "Revise State of Migration", key: "revise_status", width: 50 },
    { header: "Revised Id", key: "revise_id", width: 35 },
    { header: "Collabspace", key: "collabspace", width: 25 },
  ];

  // Consolidate data into a single row structure
  const rows = [];
  // Check if createDocument or promatedObjects exist and have data

  if (
    (jsonResponse?.createDocument &&
      jsonResponse?.createDocument?.length > 0) ||
    (jsonResponse?.promatedObjects && jsonResponse?.promatedObjects?.length > 0)
  ) {
    const createDocument = jsonResponse?.createDocument || [];
    let promatedObjects = jsonResponse?.promatedObjects || [];
    promatedObjects = promatedObjects
      .map((array) => array.slice(1)) // Remove the first object from each sub-array
      .flat(); // Flatten the array 

    const allResults = promatedObjects
      .map((item) => item.results || []) // Extract the results array from each object
      .flat(); // Flatten all results arrays into

    // Iterate over the larger of the two arrays
    const maxLength = Math.max(createDocument.length, promatedObjects.length);

    for (let i = 0; i < maxLength; i++) {
      const createItem = createDocument[i] || {}; // Get the current item or an empty object

      // Adjusted logic to correctly traverse promatedObjects structure
      const promatedItem =
        allResults.find((result) => result?.maturityState === "RELEASED") || {}; // Find the first "released" state object or use an empty object

      rows.push({
        name: createItem?.dataelements?.name || "",
        title: createItem?.dataelements?.title || "",
        description: createItem?.dataelements?.description || "",
        id: createItem?.id || promatedItem?.physicalid || "", // Prefer createDocument ID, fallback to promatedObjects ID
        created: createItem?.dataelements?.name ? "success" : "", // Mark as "success" if createDocument item exists
        maturitystatus: promatedItem?.maturityState || "", // Use promatedObjects maturity state (only "released")
        revise_status: " ", // Placeholder for revise state
        revise_id: "", // Placeholder for revised ID
        collabspace: createItem?.dataelements?.collabspace || "",
      });
    }
  }

  if (
    jsonResponse?.searchData?.length > 0 ||
    jsonResponse?.reviseData?.length > 0
  ) {
    const searchData = jsonResponse?.searchData || [];
    const reviseData = jsonResponse?.reviseData || [];

    const allReviseResults = reviseData
      .map((reviseItem) => reviseItem[0].results || []) // Extract the results array from each reviseItem
      .flat(); // Flatten all results arrays into a single array

    // Iterate over reviseData and combine with searchData
    allReviseResults.flat().forEach((reviseItem, index) => {
    const searchItem = searchData[index + 1] || {}; // Match by index or use an empty object

      rows.push({
        name: searchItem?.dataelements?.name || "",
        title: searchItem?.dataelements?.title || "",
        description: searchItem?.dataelements?.description || "",
        id: searchItem?.id || reviseItem?.physicalid || "", // Prefer search ID, fallback to revise ID
        created: searchItem ? "success" : "", // Mark as "success" if searchItem exists
        maturitystatus: reviseItem?.maturityState || "Revised", // Use revise maturity state or default to "Revised"
        revise_status:
          reviseItem?.revision ||
          searchItem?.dataelements?.revision ||
          "Success", // Use search revision or default to "Success"
        revise_id: reviseItem?.physicalid || "", // Use revise ID
        collabspace: searchItem?.dataelements?.collabspace || "",
      });
    });
  }

  if (
    jsonResponse?.customTypeData?.createDocument?.length > 0 &&
    jsonResponse?.customTypeData?.reviseData?.length > 0
  ) {
    const createDocuments = jsonResponse.customTypeData.createDocument;
    const reviseData = jsonResponse.customTypeData.reviseData;

    // Iterate over both arrays and combine data
    reviseData.forEach((reviseItem, index) => {
      if (reviseItem?.results?.length > 0) {
        reviseItem.results.forEach((item, resultIndex) => {
          const createItem = createDocuments[index] || {}; // Match by index or use an empty object
          rows.push({
            name: createItem?.name || "",
            title: createItem?.title || "",
            description: createItem?.description || "",
            id: item?.physicalid || "",
            created: "success", // Assuming created state is always "success"
            maturitystatus: "Revised",
            revise_status: "Success",
            revise_id: item?.physicalid || "",
            collabspace: createItem?.collabspace || "",
          });
        });
      }
    });
  }

  // Add rows to the sheet
  rows.forEach((row) => {
    sheet.addRow(row);
  });

  // Return the buffer of the workbook
  return await workbook.xlsx.writeBuffer();
};
