import ExcelJS from "exceljs";

export const generateExcelMfgItem = async (jsonData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("MFG Data");

  // Define columns – extendable and relevant to your input
  sheet.columns = [
    { header: "Create/Revise/Custom", key: "action", width: 20 },
    { header: "Title", key: "title", width: 30 },
    { header: "Revision", key: "revision", width: 15 },
    { header: "Create Status", key: "createStatus", width: 25 },
    { header: "Create Scope and Promote Status", key: "scoped", width: 30 },
    { header: "Revise Status", key: "revise_status", width: 10 },
    {
      header: "Revise Scope and Promote Status",
      key: "scopeMessage",
      width: 30,
    },
    { header: "Custom Revise Status", key: "customRevise_Status", width: 20 },
    {
      header: "Custom Scope and Promote Status",
      key: "customScope_Message",
      width: 30,
    },
    { header: "Classify & Update Status", key: "classifyStatus", width: 25 },
  ];

  const rows = [];

  
  const matchedItems = (jsonData?.searchMfgItemWS?.matchedMfg || [])
  .flat()
  .map(item => ({
    title: item?.title || item?.Title || "",
    revision: item?.["Spec Rev"] || item?.revision || item?.Revision || ""
  }));
  
  const unmatchedItems = (jsonData?.searchMfgItemWS?.unmatchedMfg || [])
  .map(item => ({
    title: item?.title || item?.Title || "",
    revision: item?.["Spec Rev"] || item?.revision || item?.Revision || ""
  }));
  const customItems = (jsonData?.searchMfgItemWS?.customMfgValue || [])
  .map(item => ({
    title: item?.title || item?.Title || "",
    revision: item?.["Spec Rev"] || item?.revision || item?.Revision || ""
  }));

  // 🔁 Loop through unmatchedTitles
  for (let i = 0; i < unmatchedItems.length; i++) {
    const { title, revision } = unmatchedItems[i];
    
    // 1. Check if title exists in any createMfgItemWS.member entry
    const foundEntry = jsonData?.createMfgItemWS?.find((entry) =>
      entry?.member?.some((member) => member?.title === title)
    );

    const createStatus = foundEntry
    ? `Success : Create Mfg Item for ${title}`
    : `Error : Create Mfg Item for ${title}`;
    

    // get repsonse of createScopeLinkAndPromoteWS
    let scopeError = null;
    const scopeMsg = jsonData["createScopeLinkAndPromoteWS"][i]["createScope"]["message"]
    if (scopeMsg) {
      scopeError = scopeMsg;
    } else {
      scopeError = (jsonData?.createScopeLinkAndPromoteWS || []).find(
        (msg) => typeof msg === "string" && msg.startsWith(title)
      );
    }

     // Check for classify status
     const classifyStatusMsg =jsonData["classifyItmCreateWS"][i];

    rows.push({
      action: "Create",
      title: title || "",
      revision: revision,
      createStatus: createStatus || "",
      scoped: scopeError,
      revise_status: "",
      scopeMessage: "",
      customRevise_Status: "",
      customScope_Message: "",
      classifyStatus: classifyStatusMsg,
    });
  }

  // 🔁 Loop through matchedTitles
  for (let i = 0; i < matchedItems.length; i++) {
    const { title, rev } = matchedItems[i];
    console.log("rev--",rev);
    const matchedItm = jsonData?.jsonDataWS.find(item => item?.Title === title);
     const revision = matchedItm?.["Spec Rev"] || "";
    // 1. Get ReviseMfgItemWS status (from nested array)
    const reviseStatus =
      jsonData?.ReviseMfgItemWS?.[i]?.[0]?.status || "No revise status";

    // 2. Get createRevScopeLinkAndPromoteWS message
    let scopeMessage = null;
    const scopeMsg =
      jsonData?.createRevScopeLinkAndPromoteWS?.[i]?.createScope?.message;
    if (scopeMsg) {
      scopeMessage = scopeMsg;
    } else {
      scopeMessage = (jsonData?.createRevScopeLinkAndPromoteWS || []).find(
        (msg) => typeof msg === "string" && msg.startsWith(title)
      );
    }

    // 3. Check for classify status
    const classifyStatusMsg =jsonData["classifyItmReviseWS"][i];
    
    rows.push({
      action: "Revise",
      title: title || "",
      revision: revision,
      createStatus: "",
      scoped: "",
      revise_status: reviseStatus,
      scopeMessage: scopeMessage,
      customRevise_Status: "",
      customScope_Message: "",
      classifyStatus: classifyStatusMsg,
    });
  }

  // 🔁 Loop through customTitles
  for (let i = 0; i < customItems.length; i++) {
    const { title, revision } = customItems[i];
    // 1. Get ReviseMfgItemWS status (from nested array)
    const customReviseStatus =
      jsonData?.reviseCustomMfgItemWS[i];

    // 2. Get createRevScopeLinkAndPromoteWS message
    let customScopeMessage = null;
    const scopeMsg =
      jsonData?.createCustomScopeLinkAndPromoteWS?.[i]?.createScope?.message;
    const scopeMsg1 = (jsonData?.createScopeLinkAndPromoteWS || []).find(
        (msg) => typeof msg === "string" && msg.startsWith(title)
      );
    if (scopeMsg) {
      customScopeMessage = scopeMsg;
    } else if(scopeMsg1){
      customScopeMessage = scopeMsg1;
    }else{
      customScopeMessage = jsonData?.createCustomScopeLinkAndPromoteWS[i];
    }

    // 3. Check for classify status
    const classifyStatusMsg =jsonData["classifyItmCustomWS"][i];

    rows.push({
      action: "Custom",
      title: title || "",
      revision: revision,
      createStatus: "",
      scoped: "",
      revise_status: "",
      scopeMessage: "",
      customRevise_Status: customReviseStatus,
      customScope_Message: customScopeMessage,
      classifyStatus: classifyStatusMsg,
    });
  }

  // Add all rows to the sheet (no duplicates, one row per item)
  rows.forEach((row) => sheet.addRow(row));
  // Return Excel file as buffer
  return await workbook.xlsx.writeBuffer();
};
