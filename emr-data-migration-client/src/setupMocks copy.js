/**
 * Mock Setup for Local Development
 */
if (!window.widget) {
  console.log("[Local Mock] Creating mock widget object...");
  const Widget = function () {
    const events = {};
    this.uwaUrl = window.location.origin + "/";
    this.addEvent = (event, callback) => {
      console.log(`[Local Mock] Event registered: ${event}`);
      events[event] = callback;
      if (event === "onLoad") {
        if (document.readyState === "loading") {
          window.addEventListener("DOMContentLoaded", callback);
        } else {
          callback();
        }
      }
    };
    this.setTitle = (title) => {
      document.title = title;
    };
    this.dispatchEvent = () => {};
  };
  window.widget = new Widget();
  console.log("[Local Mock] Mock widget created:", window.widget);
}

// Mock `define` function for RequireJS
if (typeof window.define === "undefined") {
  console.log("[Local Mock] Mocking define function...");
  window.define = (name, deps, callback) => {
    if (typeof deps === "function") {
      callback = deps;
    }

    console.log(`[Local Mock] Defining module: ${name}`);

    if (name === "DS/DataDragAndDrop/DataDragAndDrop") {
      callback({
        createProxy: () => ({
          addEvent: (event, callback) => {
            console.log(`[Local Mock] Drag-and-Drop event registered: ${event}`);
            if (event === "drop") callback({ data: "Mock data" });
          },
        }),
      });
    } else {
      callback();
    }
  };
    // Mark `define` as AMD-compliant
    window.define.amd = true;
}


// Mock `requirejs` for local testing
if (!window.requirejs) {
  console.log("[Local Mock] Creating mock requirejs function...");
  window.requirejs = (modules, callback) => {
    console.warn("[Local Mock] Mock RequireJS: Modules not found:", modules);

    // Simulate resolving DS/DataDragAndDrop/DataDragAndDrop
    const resolvedModules = modules.map((module) => {
      if (module === "DS/DataDragAndDrop/DataDragAndDrop") {
        return window.DS.DataDragAndDrop;
      }
      return {}; // Return empty object for other modules
    });

    callback(...resolvedModules);
  };
}

// Mock `WAFData`
if (!window.WAFData) {
  console.log("[Local Mock] Mocking WAFData...");
  window.WAFData = {
    authenticatedRequest: (url, options) => {
      console.log(`[Local Mock] WAFData.authenticatedRequest called with URL: ${url}`, options);
      if (options.onComplete) {
        setTimeout(() => {
          options.onComplete({ csrf: { name: "mock-csrf-token", value: "mock-csrf-value" } });
        }, 500); // Simulate a delay
      }
      if (options.onFailure) {
        setTimeout(() => {
          options.onFailure({ error: "Mock error response" });
        }, 500); // Simulate a delay
      }
    },
  };
}

// Mock `DataDragAndDrop`
if (!window.DataDragAndDrop) {
  console.log("[Local Mock] Mocking DataDragAndDrop...");
  window.DataDragAndDrop = {
    droppable: (element, callbacks) => {
      console.log("[Local Mock] DataDragAndDrop.droppable called on element:", element);
      // Simulate drag events
      if (callbacks.enter) {
        element.addEventListener("dragenter", (e) => {
          e.preventDefault();
          callbacks.enter(e);
        });
      }
      if (callbacks.leave) {
        element.addEventListener("dragleave", (e) => {
          e.preventDefault();
          callbacks.leave(e);
        });
      }
      if (callbacks.drop) {
        element.addEventListener("drop", (e) => {
          e.preventDefault();
          const mockData = JSON.stringify({
            data: { items: [{ objectId: "mock-object-id", displayName: "Mock Object" }] },
          });
          callbacks.drop(mockData);
        });
      }
    },
  };
}











console.log("[Local Mock] Mock environment initialized.");
