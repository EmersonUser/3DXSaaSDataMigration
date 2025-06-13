// src/routes.js (or wherever your routes are defined)
import express from "express";
import { mepProducts } from "../controller/mepProducts.controller.js";
const router = express.Router();

router.post("/mepProducts", mepProducts);

export default router;
