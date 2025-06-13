import {
  readExcelFile,
  uploadFile,
} from "../utils/utilsParts.js";
import {
    searchProduct,
    createChangeRequest,
    createChangeOrder,
    createChangeAction,
    createImpactAnalysis,
    modifyChangeAction,
    modifyChangeOrder,
    modifyChangeRequest,
    modifyImpactAnalysis,
    promoteScenerio,
    approveScenerio,
    approveScenerioForCO,
    getCestamp
} from "../service/changeObjects.service.js";
import { authenticateUser } from "../auth/authorizationService.js";

const changeCreds = { changeUsername: "3dxserviceuser@emerson.com", changePassword: "Emerson123" }
const sendCredsForChange =()=> changeCreds;

// Controller for Change Objects connection
export const changeObjectsController = async (req, res) => {
  const {authData} = await authenticateUser(req, res, sendCredsForChange);
    try {
      // Upload the file
      const file = await uploadFile(req, res);
      const { path: filePath } = file;
      // Convert Excel to JSON
      const jsonData = await readExcelFile(filePath);

      const resultData = [];
          
      for (const item of jsonData) {
        let CRrelatedStatus = {};

        const proposedChanges = item['Proposed Changes'];
        const searchData = proposedChanges.split('|').map(change => {
            const [Type, Name, Revision] = change.split(';');
            return { Type, Name, Revision };
          });

    // Search Parent Product and Child Product
    const search = await searchProduct(authData, searchData);

    const ifCR = item.hasOwnProperty("Change Request Name") && item["Change Request Name"].trim().length > 0;

    let CAcreate, CAmodify, COcreate, COmodify, CRcreate, CRmodify, IAcreate, IAmodify, 
    IApromoteToInApproval, IApromoteToComplete, CRpromoteToInWork, CRpromoteToInApproval, 
    CRcestamp, CRapprove, COpromoteToInWork, CApromoteToInWork, CApromoteToInApproval,
    CAcestamp, CAapprove, COapprove, CRpromoteToComplete;

    // Creating and Updating Change Action
    CAcreate = await createChangeAction(authData, item["Change Action Name"])
    CAmodify = await modifyChangeAction(authData, CAcreate?.data?.id, CAcreate?.data?.cestamp, search)

    // Creating and Updating Change Order
    COcreate = await createChangeOrder(authData, item["Change Order Name"])
    COmodify = await modifyChangeOrder(authData, COcreate?.data?.id, COcreate?.data?.cestamp, CAcreate?.data?.id, search)


    if(ifCR) {
    // Creating and Updating Change Request
    CRcreate = await createChangeRequest(authData, item["Change Request Name"])
    CRmodify = await modifyChangeRequest(authData, CRcreate?.data?.id, CRcreate?.data?.cestamp, COcreate?.data?.id, search)

    // Creating and Updating Impact Analysis
    IAcreate = await createImpactAnalysis(authData, item["Change Request Name"], CRcreate?.data?.id)
    IAmodify = await modifyImpactAnalysis(authData, IAcreate?.data?.id, IAcreate?.data?.cestamp, CRcreate?.data?.id, search)

    // Promoting and Approving Scenerios
    IApromoteToInApproval = await promoteScenerio(authData, IAcreate?.data?.id, "In Approval", "IA")
    IApromoteToComplete = await promoteScenerio(authData, IAcreate?.data?.id, "Complete", "IA")
    CRpromoteToInWork = await promoteScenerio(authData, CRcreate?.data?.id, "In Work", "CR")
    CRpromoteToInApproval = await promoteScenerio(authData, CRcreate?.data?.id, "In Approval", "CR")
    CRcestamp = await getCestamp(authData, CRcreate?.data?.id, "dscm/changerequest")
    CRapprove = await approveScenerio(authData, CRcreate?.data?.id, CRcestamp, "dscm/changerequest")
    }
    COpromoteToInWork = await promoteScenerio(authData, COcreate?.data?.id, "In Work", "CO")
    CApromoteToInWork = await promoteScenerio(authData, CAcreate?.data?.id, "In Work", "CA")
    CApromoteToInApproval = await promoteScenerio(authData, CAcreate?.data?.id, "In Approval", "CA")
    CAcestamp = await getCestamp(authData, CAcreate?.data?.id, "dslc/changeaction")
    CAapprove = await approveScenerio(authData, CAcreate?.data?.id, CAcestamp, "dslc/changeaction")
    COapprove = await approveScenerioForCO(authData, COcreate?.data?.id)
    if(ifCR) {
    CRpromoteToComplete = await promoteScenerio(authData, CRcreate?.data?.id, "Complete", "CR")

    const promoteIAObject = { IApromoteToInApproval, IApromoteToComplete };
    const promoteCRObject = { CRpromoteToInWork, CRpromoteToInApproval, CRpromoteToComplete };

    let promoteIAStatus = '';
    let promoteCRStatus = '';

    Object.values(promoteIAObject).forEach(val => val?.status && (promoteIAStatus += val.status + ', '));
    Object.values(promoteCRObject).forEach(val => val?.status && (promoteCRStatus += val.status + ', '));

    promoteIAStatus = promoteIAStatus.slice(0, -2);
    promoteCRStatus = promoteCRStatus.slice(0, -2);

    CRrelatedStatus = {
      "Change Request status": CRmodify?.status,
      "Impact Analysis status": IAmodify?.status,
      "Promote Impact Analysis Status": promoteIAStatus, 
      "Promote Change Request Status": promoteCRStatus, 
    }
    }
    const promoteCOObject = { COpromoteToInWork, CApromoteToInWork };
    const promoteCAObject = { COpromoteToInWork, CApromoteToInWork, CApromoteToInApproval };
    const approveObject = { CRapprove, CAapprove, COapprove };

    let promoteCOStatus = '';
    let promoteCAStatus = '';
    let approveStatus = '';

    Object.values(promoteCOObject).forEach(val => val?.status && (promoteCOStatus += val.status + ', '));
    Object.values(promoteCAObject).forEach(val => val?.status && (promoteCAStatus += val.status + ', '));
    Object.values(approveObject).forEach(val => val?.status && (approveStatus += val.status + ', '));

    promoteCOStatus = promoteCOStatus.slice(0, -2);
    promoteCAStatus = promoteCAStatus.slice(0, -2);
    approveStatus = approveStatus.slice(0, -2);

    const conditionalSpread = ifCR && { ...CRrelatedStatus };
    const combineStatus = {
      "Change Action Status": CAmodify?.status,
      "Change Order Status": COmodify?.status,
      ...conditionalSpread,
      "Promote Change Order Status": promoteCOStatus, 
      "Promote Change Action Status": promoteCAStatus,
      "Approve Status": approveStatus
    };

    resultData.push({ ...item, ...combineStatus });
    }

    res.send(resultData);

    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred during the Changing Governance"
      });
    }
};