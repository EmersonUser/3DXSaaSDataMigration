import { authenticateUser } from "../auth/newAuth.js";
import { readExcelFile, uploadFile } from "../utils/utilsParts.js";
import {
  searchMep,
  createMepProduct,
  formatMepItems,
  createReqMepLocate,
  mepLocate,
  ReqMepCreate,
  mepCreateService,
  createQualify,
  promoteState,
  createQualifyResult,
  promoteMepState,
  formatResult,
} from "../service/mep.servie.js";
import { authenticateUser1 } from "../auth/csfr1Auth.js";
import { authenticateUser2 } from "../auth/qualificationAuth.js";

// Controller to parts products
export const mepProducts = async (req, res) => {
  try {
    // Promisify the file upload
    const file = await uploadFile(req, res);
    const { path: filePath } = file;

    // Convert the Excel file to JSON
    const jsonData = await readExcelFile(filePath);
    Object.assign(req, { jsonData });
    const authData = await authenticateUser(req, res);
    const authData1 = await authenticateUser1(req, res);
    const authData2 = await authenticateUser2(req, res);
    const searchData = await searchMep(req, authData);
    const createMepReqData = formatMepItems(searchData?.result);
    req.createMepReqData = createMepReqData;
    const addMepProducts = await createMepProduct(req);
    req.addMepProducts = addMepProducts;
    const createReqMep = createReqMepLocate(addMepProducts?.member);
    req.createReqMep = createReqMep;
    const mepLocateApi = await mepLocate(req, res);
    req.mepLocateApi = mepLocateApi.member;
    const createMeprequest = ReqMepCreate(addMepProducts?.member, jsonData);
    req.createMeprequest = createMeprequest;
    const mepCreateServiceResult = await mepCreateService(req, res);
    req.mepCreateServiceResult = mepCreateServiceResult;
    const createQualifyRequest = await createQualify(
      mepCreateServiceResult?.member,
      searchData?.result
    );
    req.createQualifyRequest = createQualifyRequest;
    const createQualifyRes = await createQualifyResult(req, res);
    const promoteMep = await promoteState(req, res);
    req.createQualifyRes = createQualifyRes;
    const mepQualifyPromote = await promoteMepState(req, res);
    const expectedResult = await formatResult(
      jsonData,
      searchData,
      addMepProducts,
      mepLocateApi,
      mepCreateServiceResult,
      createQualifyRes,
      promoteMep,
      mepQualifyPromote
    );
    res.status(200).json({
      msg: "going right as expected",
      searchData: searchData,
      addMepProducts: addMepProducts,
      mepLocateApi: mepLocateApi,
      mepCreateServiceResult: mepCreateServiceResult,
      QualifyResults: createQualifyRes,
      promoteMep: promoteMep,
      qualificationPromote: mepQualifyPromote,
      expectedResult: expectedResult,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred during the mep process." });
  }
};
