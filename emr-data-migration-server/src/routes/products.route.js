// src/routes.js (or wherever your routes are defined)
import express from "express";
import { productsParts } from "../controller/products.controller.js"; // Assuming you have a productService for searching products

const router = express.Router();
router.post("/createparts", productsParts);

export default router;
