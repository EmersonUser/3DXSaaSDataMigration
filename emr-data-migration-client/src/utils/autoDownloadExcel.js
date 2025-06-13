import { generateExcel } from "./jsonToExcel";
import { generateExcelPart } from "./autoDownloadParts";
import { generateExcelMfgItem } from "./autoDownloadExcelMfgItem";

export const autoDownloadExcel = async (jsonData, fileName, type = null) => {
  let excelBuffer
  if (!jsonData || jsonData.length === 0) {
    console.error("No data provided for export");
    return;
  }
  // Create a Blob and trigger download
  if(type === "document"){
   excelBuffer = await generateExcel(jsonData)
  }else if(type === "part"){
    excelBuffer = await generateExcelPart(jsonData?.resultData)
  }else if(type === "ManufacturingItem"){
    excelBuffer = await generateExcelMfgItem(jsonData)
  }else {
    console.error("No type provided for export");
    return;
  }
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};