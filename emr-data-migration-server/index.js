import express from "express";
import cors from "cors";
import products from "./src/routes/products.route.js"; // Use 'import' and add the .js extension
import ebom from "./src/routes/ebom.route.js";
import documents from "./src/routes/documents.route.js"; // Use 'import' and add the .js extension
import mbom from "./src/routes/mbom.route.js";
import connectToFileShare from "./src/routes/remoteFiles.route.js"; // Use 'import' and add the .js extension
import mfgItem from "./src/routes/mfgItm.route.js";
import changeObjects from "./src/routes/changeObjects.route.js";

import "./src/config/customConsole.js"; // Adjust the path based on your project structure
import mepItem from "./src/routes/mep.route.js";

const app = express();
const PORT = process.env.PORT || 8086;
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow credentials (if needed)
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Use this for form data (application/x-www-form-urlencoded)
app.get("/", (req, res) => {
  res.send("Hello from Node.js Docker container!");
});

app.use("/product/engineering/v1", products);
app.use("/product/engineering/v1", ebom);
app.use("/document/engineering/v1", documents);
app.use("/product/engineering/v1", mbom);
app.use("/document/engineering/v1", connectToFileShare);
app.use("/product/engineering/v1", mfgItem);
app.use("/product/engineering/v1", mepItem);
app.use("/change/engineering/v1", changeObjects);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).timeout = 60 * 60 * 1000; // 1 hour
