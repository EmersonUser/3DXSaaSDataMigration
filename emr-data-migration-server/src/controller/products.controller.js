import {
  readExcelFile,
  searchProducts,
  formatUnmatchedItems,
  uploadFile,
  promateObjects,
  revisedItem,
  promatecustomObjects,
} from "../utils/utilsParts.js";
import { authenticateUser } from "../auth/authorizationService.js";
import {
  createProduct,
  promateUnmatchedState,
  findLibraryId,
  reviseProduct,
  deleteOldProducts,
  createcustomProduct,
  revisecustomProduct,
  findcustomLibraryId,
  promatecustomrevisedState,
  promotePromatedscenerio,
} from "../service/products.service.js";
// Controller to parts products
export const productsParts = async (req, res) => {
  try {
    // Promisify the file upload
    const file = await uploadFile(req, res);
    const { path: filePath } = file;
    console.log(filePath, "FILES>>>>");

    // Convert the Excel file to JSON
    const jsonData = await readExcelFile(filePath);
    Object.assign(req, { jsonData });
    const authData = await authenticateUser(req, res);
    // req.jsonData = jsonData;
    // Search for matched and unmatched products
    console.log(req.authData, "AUTHSERVICES");
    const searchData = await searchProducts(req, authData);
    let { matched, unmatched, customValue, customSearchedData } = searchData;
    req.customSearchedData = customSearchedData;
    req.customValue = customValue;
    req.matched = matched;
    req.unmatched = unmatched;
    let promatecutomObject = null;
    let deleteOldParts = [];
    let findcustombyIds = null;
    let addcustomProducts = null;
    let promatecutomObj = null;
    let revisecustomProducts = null;
    let findbyIds = null;
    let revisematchedProducts = null;
    let addProducts = null; // Initialize addProducts outside of the if block
    let promatematchObj = null;
    let promateRevmatchObj = null;
    let promateObj = null; // Declare promateObj outside the if block and initialize with null
    if (matched && matched.length > 0) {
      // req.matched = matched;
      Object.assign(req, { matched });
      let { promateScenerion, revisionScenerion } = await revisedItem(req);
      if (promateScenerion) {
        console.log(promateScenerion, "promateScenerion");
        const [...idss] = promateScenerion?.map((item) => item.id);
        req.idss = idss;
        promatematchObj = await promotePromatedscenerio(req);
        console.log("Result for IN_WORK revise Promate", idss, promatematchObj);
      }
      req.revisionScenerion = matched;
      const [...ids] = revisionScenerion?.map((item) => item.id);
      req.ids = ids;
      revisematchedProducts = await reviseProduct(req);
      // deleteOldParts = await deleteOldProducts(req);
      console.log("Result of Revise", revisematchedProducts);
      Object.assign(req, { revisematchedProducts });
      promateRevmatchObj = await promateUnmatchedState(req);
      console.log("Result for revise Promate", promatematchObj);
    }
    if (unmatched && unmatched.length > 0) {
      const createReqData = await formatUnmatchedItems(unmatched);
      console.log("payload for create Api", createReqData);
      Object.assign(req, { createReqData });
      req.createReqData = createReqData;
      addProducts = await createProduct(req); // Assign value to addProducts
      console.log("Response for create Api", addProducts);
      req.addProducts = addProducts?.member;
      // Initialize promateObj here
      promateObj = await promateObjects(req);
      console.log("Response for Promate Api", promateObj);
      findbyIds = await findLibraryId(req);
      Object.assign(req, { promateObj });
    }
    if (customValue && customValue.length > 0) {
      const createcustomReqData = await formatUnmatchedItems(customValue);
      console.log(
        "payload for custom create Api",
        JSON.stringify(createcustomReqData)
      );
      Object.assign(req, { createcustomReqData });
      req.createcustomReqData = createcustomReqData;
      addcustomProducts = await createcustomProduct(req);
      console.log("Response for custom Create", addcustomProducts?.member);
      req.addcustomProducts = addcustomProducts?.member;
      promatecutomObj = await promatecustomObjects(req);
      console.log("Response for custom Promate Api", promatecutomObj);
      revisecustomProducts = await revisecustomProduct(req);
      req.revisecustomProducts = revisecustomProducts;
      console.log("Result of custom Revise", revisecustomProducts);
      Object.assign(req, { revisecustomProducts });
      deleteOldParts = deleteOldProducts(req);
      promatecutomObject = await promatecustomrevisedState(req);
      findcustombyIds = await findcustomLibraryId(req);
    }
    const resultData = {
      searcheWS: searchData,
      allCreatedpart: {
        searched: unmatched,
        created: addProducts?.member,
        promated: promateObj,
        Classified: findbyIds,
      },
      allRevisionParts: {
        searched: matched,
        revised: revisematchedProducts,
        promate: promatematchObj,
      },
      customCreationRevision: {
        searched: customValue,
        created: addcustomProducts?.member,
        revised: revisecustomProducts,
        promate: promatecutomObject,
        Classified: findcustombyIds,

        // Classified: findbyIds,
      },
    };

    res.status(200).json({
      resultData,
    });
  } catch (error) {
    console.error(error);
    // Send error response
    res
      .status(500)
      .json({ error: "An error occurred during the part process." });
  }
};
