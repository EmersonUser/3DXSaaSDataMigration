import ExcelJS from "exceljs";

export const generateExcel = async (jsonData) => {
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
    { header: "Owner", key: "owner", width: 20 },
    { header: "Organization", key: "organization", width: 20 },
    { header: "Collabspace", key: "collabspace", width: 25 },
    { header: "Cestamp", key: "cestamp", width: 35 },
  ];

  // Consolidate data into a single row structure
  const rows = [];
  if (jsonData?.searcheWS?.matched) {
    jsonData.searcheWS.matched.map((item) => {
      rows.push({
        name: item?.name || "",
        title: item.title || "",
        description: item.description || "",
        id: item.id || "",
        created: "Parts are Created", // Assuming created state is always "success"
        maturitystatus: `revision faild with ${item.revision}`, // Placeholder for maturity state
        revise_status: `revised for ${item.revision}`, // Placeholder for revise state
        revise_id: "", // Placeholder for revised ID
        owner: item.owner || "",
        organization: item.organization || "",
        collabspace: item.collabspace || "",
        cestamp: item.cestamp || "",
      });
    });
  }

  // Process created products
  if (jsonData.createdProductsWS) {
    jsonData?.createdProductsWS?.member?.forEach((item) => {
      rows.push({
        name: item?.name || "",
        title: item.title || "",
        description: item.description || "",
        id: item.id || "",
        created: "success", // Assuming created state is always "success"
        maturitystatus: "", // Placeholder for maturity state
        revise_status: "", // Placeholder for revise state
        revise_id: "", // Placeholder for revised ID
        owner: item.owner || "",
        organization: item.organization || "",
        collabspace: item.collabspace || "",
        cestamp: item.cestamp || "",
      });
    });
  }

  // Access the results array correctly
  if (jsonData.promateObjWS) {
    jsonData.promateObjWS?.results?.results.forEach((item, index) => {
      const maturityState = item.maturityState || ""; // Access maturityState directly
      const id = item.id || ""; // Access id directly

      if (rows[index]) {
        rows[index].maturitystatus = maturityState; // Add maturity state to the corresponding row
        rows[index].id = id; // Add id to the corresponding row
      } else {
        rows.push({
          name: "",
          title: "",
          description: "",
          id: "", // Set id here
          created: "",
          maturitystatus: maturityState,
          revise_status: "",
          revise_id: "",
          owner: "",
          organization: "",
          collabspace: "",
          cestamp: "",
        });
      }
    });
  }

  // Process revised documents
  // Access the results array correctly
  if (jsonData.reviseProductsWS) {
    jsonData.reviseProductsWS?.result?.results?.forEach((item, index) => {
      if (rows[index]) {
        rows[index].revise_status = "success"; // Add revise status to the corresponding row
        rows[index].revise_id = item.id || ""; // Add revised ID to the corresponding row
      } else {
        rows.push({
          name: "",
          title: "",
          description: "",
          id: "",
          created: "",
          maturitystatus: "success",
          revise_status: "success", // Set revise status
          revise_id: item.id || "", // Set revised ID
          owner: "",
          organization: "",
          collabspace: "",
          cestamp: "",
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
