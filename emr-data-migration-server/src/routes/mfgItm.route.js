import express from "express";
import { manufacturingitem } from "../controller/MfgItem.controller.js";
const router = express.Router();
router.post("/manufacturingitem", manufacturingitem);
export default router;
