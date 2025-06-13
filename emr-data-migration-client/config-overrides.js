const path = require("path");

module.exports = function override(config, env) {
  // Add external modules for 3D Dashboard
  config.externals = {
    "DS/DataDragAndDrop/DataDragAndDrop": "DS/DataDragAndDrop/DataDragAndDrop",
    "DS/PlatformAPI/PlatformAPI": "DS/PlatformAPI/PlatformAPI",
    "DS/TagNavigatorProxy/TagNavigatorProxy": "DS/TagNavigatorProxy/TagNavigatorProxy",
  };

  // Ensure config.entry is an array
  if (typeof config.entry === "string") {
    config.entry = [config.entry];
  } else if (!Array.isArray(config.entry)) {
    console.error("[Config Overrides] Unexpected entry format:", config.entry);
    throw new Error("Unsupported Webpack entry format");
  }

  if (env === "development") {
    console.log("[Config Overrides] Including setupMocks.js for local development.");
    // Add setupMocks.js to the entry points for development
    config.entry.unshift(path.resolve(__dirname, "src/setupMocks.js"));
  } else {
    console.log("[Config Overrides] Excluding setupMocks.js for production build.");
    // Remove setupMocks.js from the entry points for production
    config.entry = config.entry.filter(
      (entryPoint) => !entryPoint.includes("setupMocks.js")
    );
  }

  return config;
};
