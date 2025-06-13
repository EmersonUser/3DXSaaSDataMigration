import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setDroppedObjectData } from "../../store/droppedObjectSlice";
import Loader from "../Loader/Loader"; // Import the Loader
import "./DragAndDrop.css"; // Import styles for the component
import { Image } from "react-bootstrap";


const DragAndDropComponent = () => {
  const [csrfHeaders, setCsrfHeaders] = useState(null);
  // const [droppedData, setDroppedData] = useState(null);
  const [isDropped, setIsDropped] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const initializeDroppableArea = () => {
    console.log("[DragAndDrop] Initializing droppable area...");
    const droppableContainer = document.querySelector(".droppable-container");

    if (!droppableContainer) {
      console.error("[DragAndDrop] Droppable container not found.");
      return;
    }

    window.require(
      ["DS/DataDragAndDrop/DataDragAndDrop"],
      (DataDragAndDrop) => {
        console.log("[DragAndDrop] DataDragAndDrop module loaded.");

        DataDragAndDrop.droppable(droppableContainer, {
          drop: (data) => {
            console.log("[DragAndDrop] Drop event:", data);
            const parsedData = JSON.parse(data);
            handleDrop(parsedData.data.items);
          },
          enter: () => {
            console.log("[DragAndDrop] Drag Enter");
            droppableContainer.classList.add("drag-over");
          },
          leave: () => {
            console.log("[DragAndDrop] Drag Leave");
            droppableContainer.classList.remove("drag-over");
          },
        });
      }
    );
  };

  const fetchCsrfTokenAndDependencies = (dataItems) => {
    console.log("[Dependencies] Loading WAFData and fetching CSRF token...");
    setLoading(true); // Set loading state
    window.require(["DS/WAFData/WAFData"], (WAFData) => {
      console.log("[Dependencies] WAFData loaded.");

      const csrfURL =
        "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152";

      WAFData.authenticatedRequest(csrfURL, {
        method: "GET",
        type: "json",
        onComplete: (response) => {
          console.log("[CSRF] Token fetched:", response);
          const csrfToken = response.csrf.name;
          const csrfValue = response.csrf.value;
          const securityContextHeader = "SecurityContext";
          const securityContextValue =
            "ctx%3A%3AVPLMProjectLeader.BU-0000001.Rosemount%20Flow";

          const headers = {
            [csrfToken]: csrfValue,
            [securityContextHeader]: securityContextValue,
          };
          setCsrfHeaders(headers);
          console.log("[CSRF] Headers set:", headers);
          fetchObjectDetails(dataItems, headers);
        },
        onFailure: (error) => {
          console.error("[CSRF] Failed to fetch token:", error);
          setLoading(false); // Clear loading state on failure
        },
      });
    });
  };

  const handleDrop = (dataItems) => {
    console.log("[Drop] Handling drop event with items:", dataItems);
    if (!csrfHeaders) {
      console.log("[Drop] Fetching CSRF token and dependencies...");
      fetchCsrfTokenAndDependencies(dataItems);
    } else {
      console.log("[Drop] CSRF headers already available:", csrfHeaders);
      fetchObjectDetails(dataItems, csrfHeaders);
    }
  };

  const fetchObjectDetails = (dataItems, headers) => {
    if (!dataItems || dataItems.length === 0) {
      console.error("[Object Details] No items to fetch.");
      setLoading(false); // Clear loading state
      return;
    }

    const objectID = dataItems[0]?.objectId;
    console.log("[Drop] dataItems:", dataItems);
    if (!objectID) {
      console.error(
        "[Object Details] Missing or invalid object ID:",
        dataItems
      );
      setLoading(false); // Clear loading state
      return;
    }

    const objectDetailsURL = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/${objectID}?$mask=dsmveng:EngItemMask.Details`;

    window.require(["DS/WAFData/WAFData"], (WAFData) => {
      WAFData.authenticatedRequest(objectDetailsURL, {
        method: "GET",
        headers,
        type: "json",
        onComplete: (response) => {
          console.log("[Object Details] Response:", response);
          dispatch(setDroppedObjectData(response)); // Dispatch to Redux store
          // setDroppedData(response);
          setIsDropped(true);
          setLoading(false); // Clear loading state
        },
        onFailure: (error) => {
          console.error("[Object Details] Failed to fetch data:", error);
          setLoading(false); // Clear loading state
        },
      });
    });
  };

  // Initialize droppable area on mount
  useEffect(() => {
    initializeDroppableArea();
  }, []);

  return (
    <>
      {loading && (
        <Loader />
      )}
      {!loading && (
        <div
          className={`droppable-container mt-5 ${isDropped ? "dropped-active" : ""}`}
        >
          <Image
            style={{ width: "90px", height: "90px" }}
            src={require("../../images/drag.png")}
            alt="Data Collect"
            className="search-icon"
          />
          <span className="drag-and-drop-text">Drag and Drop</span>
          <div className="divider-container">
            <hr className="divider" />
            <span className="divider-text">or</span>
            <hr className="divider" />
          </div>
          <div className="search-content-container">
            <Image style={{ width: "40px", height: "40px" }} src={require("../../images/search.png")} alt="Search" />
            <span className="ms-4 drag-and-drop-text">
              Click here to search content
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default DragAndDropComponent;
