import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
// import './setupMocks';
import { initWidget } from "./lib/widget";
import { Provider } from "react-redux";
import store from "./store";

// Dynamically import setupMocks.js in development mode
if (process.env.NODE_ENV === "development") {
  console.log("[Index.js] Importing setupMocks.js for development...");
  require("./setupMocks");
} else {
  console.log("[Index.js] Skipping setupMocks.js for production...");
}

// Dynamically set Webpack's public path if `widget` is available
if (window.widget && window.widget.uwaUrl) {
  const path = window.widget.uwaUrl.substring(
    0,
    window.widget.uwaUrl.lastIndexOf("/") + 1
  );
  if (path) {
    __webpack_public_path__ = path;
    console.log("Public path set to:", __webpack_public_path__);
  } else {
    console.error("Invalid uwaUrl format:", window.widget.uwaUrl);
  }
} else {
  console.error("uwaUrl is missing. Using default './' as public path.");
  __webpack_public_path__ = "./";
}

function start() {
  console.log("Starting React App...");
  console.log("Checking DOM before starting React app...");
  console.log("Current DOM:", document); // Log DOM structure to verify the presence of #root
  console.log(
    "Available widget container:",
    window.widget ? window.widget.getContainer?.() : null
  );

  let rootElement =
    window.widget?.body?.querySelector("#root") ||
    document.getElementById("root");
  if (!rootElement) {
    console.warn("Root element not found. Creating dynamically...");
    if (window.widget && window.widget.body) {
      // Use widget's body if available
      rootElement = document.createElement("div");
      rootElement.id = "root";
      widget.body.appendChild(rootElement);
    } else {
      // Fallback to document body
      rootElement = document.createElement("div");
      rootElement.id = "root";
      document.body.appendChild(rootElement);
    }
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
}

export function initializeWidget() {
  console.log("Widget Details:");
  // console.log("widget.id:", widget?.id);
  // console.log("widget.uwaUrl:", widget?.uwaUrl);
  // console.log("widget.body:", widget?.body);
  // console.log("widget.getContainer:", widget?.getContainer?.());
  //   console.log("Starting widget initialization...");
  //   console.log("Current DOM:", document); // Log the entire DOM structure
  //   console.log("Available widget container:", window.widget ? window.widget.getContainer?.() : null); // Log widget container if it exists
  initWidget(
    (widget) => {
      console.log("Widget initialized");
      widget.addEvent("onLoad", () => {
        console.log("onLoad event triggered");
        start();
      });

      widget.addEvent("onRefresh", () => {
        console.log("onRefresh event triggered");
      });
      // Register onResize event
      widget.addEvent("onResize", () => {
        console.log("Widget resized:", {
          width: widget.body?.offsetWidth || "unknown",
          height: widget.body?.offsetHeight || "unknown",
        });
      });
      // Log lifecycle info
      console.log("Widget lifecycle events registered.");
    },
    (error) => {
      console.error("Widget initialization failed:", error);
    }
  );
}

console.log("Starting widget initialization...");
initializeWidget(); // Invoke the function here to initialize the widget

// Measure performance in your app (optional)
reportWebVitals();
