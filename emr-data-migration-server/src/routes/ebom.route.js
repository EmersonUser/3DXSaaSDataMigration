// src/routes.js (or wherever your routes are defined)
import express from "express";
import { ebomConnection } from "../controller/ebom.controller.js";

const router = express.Router();

// Authentication route
// router.post("/auth", authenticateUser, (req, res) => {
//   // Send the authentication data back to the client if needed
//   res.status(200).json(req.authData);
// });

router.post("/create-ebomConnection", ebomConnection);

export default router;
