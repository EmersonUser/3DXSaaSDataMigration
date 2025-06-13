import { environment } from "../config/environment";

export const OPTIONS = [
    { value: "part", label: "Part" },
    { value: "document", label: "Document/Spec" },
    { value: "ebom", label: "EBOM Connection" },
    { value: "bomchange", label: "Change" },
    { value: "ManufacturingItem", label: "Manufacturing Item" },
    { value: "mbom", label: "MBOM Connection" },
    { value: "MEP", label: "MEP" },
    { value: "MCO", label: "MCO" },
    { value: "partrev", label: "Part with Revision" },
  ];


export const API_ENDPOINTS = {
  part: `${environment.VITE_API_URL}/product/engineering/v1/createparts`,
  document: `${environment.VITE_API_URL}/document/engineering/v1/searchDocuments`,
  ebom: `${environment.VITE_API_URL}/product/engineering/v1/create-ebomConnection`,
  bomchange: `${environment.VITE_API_URL}/product/engineering/v1/upload/bomchange`,
  ManufacturingItem: `${environment.VITE_API_URL_LOCAL}/product/engineering/v1/manufacturingitem`,
  mbom: `${environment.VITE_API_URL}/product/engineering/v1/create-mbomConnection`,
  MEP: `${environment.VITE_API_URL}/product/engineering/v1/upload/mep`,
  MCO: `${environment.VITE_API_URL}/product/engineering/v1/upload/mco`,
  partrev: `${environment.VITE_API_URL}/product/engineering/v1/upload/partrev`,
  remoteFile: `${environment.VITE_API_URL}/document/engineering/v1/readFile/Test3.txt`,
};

export const EXCELFILETYPE = {
  document: "Document_Data",
  part: "Part_Data",
  ebom: "EBOM_Status",
  bomchange: "Change",
  mbom: "MBOM_Status",
  ManufacturingItem: "Mfg_Item",
}