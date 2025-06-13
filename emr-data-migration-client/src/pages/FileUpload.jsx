import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCloudUploadAlt } from "react-icons/fa";
import CardComponent from "../components/Card/Card";
import axios from "axios";
import "./styles.css";
import FormData from "form-data";
import SelectComponent from "../components/Select/Select";
import { OPTIONS, API_ENDPOINTS, EXCELFILETYPE } from "../utils/constants";
import Loader from "../components/Loader/Loader";
import { autoDownloadExcel } from "../utils/autoDownloadExcel";
import { downloadExcel } from "../utils/AutoDownloadExcelBackUp";

const FileUploadComponent = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState("part");
  const [responseMessage, setResponseMessage] = useState(null);
  const [loading, setLoading] = useState(false); // Loader state
  const [downloadData, setDownloadData] = useState(null); // Data for download

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }
    console.log("Selected fiel type:", selectedType);
    const apiUrl = API_ENDPOINTS[selectedType];

    if (!apiUrl) {
      console.error("No API endpoint found for selected type.");
      return;
    }

    setLoading(true); // Start loader

    try {
      let data = new FormData();
      if (
        selectedType === "ebom" ||
        selectedType === "mbom" ||
        selectedType === "part" ||
        selectedType === "ManufacturingItem"
      ) {
        // Send only a single file with key "file"
        data.append("file", selectedFile[0]);
      } else {
        // Send multiple files with key "files"
        Object.values(selectedFile).forEach((file) => {
          data.append("files", file);
        });
      }

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: apiUrl,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        data: data,
      };

      const response = await axios.request(config);
      if (response.status === 200) {
        console.log("File uploaded successfully:", response.data);

        const downloadFunction =
          selectedType === "ebom" || selectedType === "mbom"
            ? downloadExcel
            : autoDownloadExcel;
        downloadFunction(
          response?.data,
          EXCELFILETYPE[selectedType],
          selectedType
        );
        setDownloadData(response?.data);
        setResponseMessage("File uploaded successfully.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setResponseMessage("File upload failed. Please try again.");
    } finally {
      setLoading(false); // Stop loader regardless of success or failure
    }
  };

  const handleDownload = async () => {
    if (!downloadData) {
      alert("No data available for download. Please upload a file first.");
      return;
    }
    /* commenting it for now since we need this functionality in the future*/
    // const downloadFunction = selectedType === "ebom" ? downloadExcel : autoDownloadExcel;
    // downloadFunction(downloadData, EXCELFILETYPE[selectedType], selectedType);
    const apiUrl = API_ENDPOINTS?.remoteFile;

    try {
      // Fetch the file as a blob using axios
      const response = await axios.get(apiUrl, {
        responseType: "blob", // Ensure the response is treated as binary data
      });

      // Create a Blob from the response data
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      // Create a link element to trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Test3.txt"; // Set the file name for the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading the file:", error);
      alert("Failed to download the file. Please try again.");
    }
  };

  return (
    <CardComponent
      title="Import"
      text="Download Template"
      buttonLabel="Upload"
      onButtonClick={handleUpload}
      responseMessage={responseMessage}
    >
      <FaCloudUploadAlt size={50} className="upload-icon" />
      <a href="#" className="download-link" onClick={handleDownload}>
        Download
      </a>
      <div className="import-controls">
        <SelectComponent
          options={OPTIONS}
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="custom-select"
        />
        <input
          type="file"
          className="custom-file-input"
          onChange={handleFileChange}
          accept="*/*"
          multiple
          id="file-upload"
        />
      </div>
      {loading && <Loader />}
    </CardComponent>
  );
};

export default FileUploadComponent;
