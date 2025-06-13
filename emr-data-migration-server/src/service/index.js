// Import all service modules
import { checkInFile } from "./checkIn.service.js";
import { searchDocument } from "./searchDocument.service.js";
import { getCheckInTicketDocument } from "./checkInTicketDocument.service.js";
import { createDocumentCopy } from "./createDocumentCopy.service.js";
import { findLibraryID } from "./findLibraryID.service.js";
import { classifyItems } from "./classifyItems.service.js";
import { promoteObject } from "./promoteObject.service.js";
import { searchProduct, reviseProduct, promateState } from "./products.service.js";
import { reviseService } from "./revise.service.js";
import { searchMfgItem } from "./searchMfgItem.service.js";
import { createMfgItem } from "./createMfgItem.service.js";
import { deleteLastRevisedDocument } from "./deleteDocument.service.js";

// Import utility functions
import { removeCircularReferences, readExcelFile, uploadFile, findIdByTitle } from "../utils/utilsParts.js";

// Export all services collectively
export {
    checkInFile,
    searchDocument,
    getCheckInTicketDocument,
    createDocumentCopy,
    findLibraryID,
    classifyItems,
    promoteObject,
    searchProduct,
    reviseProduct,
    promateState,
    reviseService,
    removeCircularReferences,
    readExcelFile,
    uploadFile,
    findIdByTitle,
    searchMfgItem,
    createMfgItem,
    deleteLastRevisedDocument
};
