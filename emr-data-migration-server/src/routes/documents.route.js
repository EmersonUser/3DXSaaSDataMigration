// src/routes.js (or wherever your routes are defined)
import express from "express";
import { authenticateUser } from "../auth/authorizationService.js";
import { searchDocuments } from "../controller/documents.controller.js";
const router = express.Router();
// Authentication route
// router.post("/auth", authenticateUser, (req, res) => {
//   // Send the authentication data back to the client if needed
//   console.log("Authentication successful", req);
//   res.status(200).json(req.authData);
// });

router.post("/searchDocuments", searchDocuments);

export default router;
