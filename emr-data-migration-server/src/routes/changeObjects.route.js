import express from "express";
import { changeObjectsController } from "../controller/changeObjects.controller.js";

const router = express.Router();

router.post("/change-governance", changeObjectsController);

export default router;