import * as XLSX from "xlsx";
import { generateExcel } from "./jsonToExcel";

export const downloadExcel = async (jsonData, fileName) => {
  if (!jsonData || jsonData.length === 0) {
    console.error("No data provided for export");
    return;
  }

  let formattedData = Array.isArray(jsonData) ? jsonData : [jsonData];

  // Ensure all keys are present in each row
  const allKeys = [...new Set(formattedData.flatMap(item => Object.keys(item)))];

  // Normalize data (fill missing keys with empty values)
  const normalizedData = formattedData.map(item =>
    Object.fromEntries(allKeys.map(key => [key, item[key] || ""]))
  );

 //  Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(jsonData);

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Create a Blob and trigger download
  const excelBuffer =  XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};