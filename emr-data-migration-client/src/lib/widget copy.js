/**
 * Mock the Widget Object normally provided by 3DDashboard
 */
const Widget = function () {
  let events = {};
  let title = "";

  const widgetUrl = window.location.href;

  const prefs = (() => {
    let prefsLocal = localStorage.getItem("_prefs_4_Widget_");
    if (prefsLocal) {
      try {
        prefsLocal = JSON.parse(prefsLocal);
      } catch {
        prefsLocal = {};
        localStorage.setItem("_prefs_4_Widget_", JSON.stringify(prefsLocal));
      }
    } else {
      prefsLocal = {};
      localStorage.setItem("_prefs_4_Widget_", JSON.stringify(prefsLocal));
    }
    return prefsLocal;
  })();

  const _savePrefsLocalStorage = () => {
    localStorage.setItem("_prefs_4_Widget_", JSON.stringify(prefs));
  };

  this.uwaUrl = "./";

  this.addEvent = (event, callback) => {
    console.log(`Event registered: ${event}`);
    events[event] = callback;
    if (event === "onLoad") {
      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", callback);
      } else {
        console.log("Executing onLoad callback");
        callback();
      }
    }
  };

  this.addPreference = (pref) => {
    pref.value = pref.defaultValue;
    prefs[pref.name] = pref;
    _savePrefsLocalStorage();
  };

  this.getPreference = (prefName) => {
    return prefs[prefName];
  };

  this.getUrl = () => {
    return widgetUrl;
  };
  this.getValue = (prefName) => {
    return prefs[prefName] === undefined ? undefined : prefs[prefName].value;
  };

  this.setValue = (prefName, value) => {
    prefs[prefName].value = value;
    _savePrefsLocalStorage();
  };

  this.setIcon = (icon) => {};
  this.setTitle = (t) => {
    title = t;
    document.title = title;
  };
  this.dispatchEvent = (...args) => {};
};

/**
 * Mock the UWA Object normally provided by 3DDashboard
 */
// const UWA = function() {
//     this.log = args => {
//         /* eslint no-console:off */
//     };
// };

/**
 * Mock the libraries provided by 3DDashboard
 */
const initRequireModules = function () {
  define("DS/TagNavigatorProxy/TagNavigatorProxy", [], () => {
    return {
      createProxy: () => ({
        addEvent: () => {},
        setSubjectsTags: () => {},
      }),
    };
  });

  define("DS/PlatformAPI/PlatformAPI", [], () => {
    return {
      getUser: () => ({ name: "Mock User" }),
      subscribe: (topic, callback) => ({ topic, callback }),
    };
  });

  // Add a catch-all for undefined modules

  define(() => {
    console.warn("Undefined module requested");
    return {};
  });
};

/**
 * Initialize the widget object
 * In Standalone mode :
 *      - Create the widget object with some (to be completed) API
 *      - Create the UWA object with some (to be completed) API
 *      - Load the requirejs library
 *      - Mock some 3DDashboard API (to be completed)
 * In case of 3DDashboard :
 *      - wait for the widget object to be inserted by the 3DDashboard
 */
export function initWidget(cbOk, cbError) {
  console.log("Initializing widget..."); // Log added
  const waitFor = function (whatToWait, maxTry, then) {
    if (typeof window[whatToWait] !== "undefined") {
      then();
    } else if (maxTry === 0) {
      document.body.innerHTML =
        "Error while trying to load widget. See console for details";
      throw new Error(`${whatToWait} didn't load`);
    } else {
      setTimeout(waitFor, 200, whatToWait, --maxTry, then);
    }
  };

  const loadRequire = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = process.env.PUBLIC_URL + "/lib/require.js"; // Fetch from public folder
      script.onload = resolve;
      script.onerror = () => {
        console.error("Failed to load RequireJS script.");
        reject();
      };
      document.head.appendChild(script);
    });
  };

  const updatePublicPath = () => {
    if (widget && widget.uwaUrl) {
      if (widget.uwaUrl.includes("/")) {
        window.__webpack_public_path__ = widget.uwaUrl.substring(
          0,
          widget.uwaUrl.lastIndexOf("/") + 1
        );
        console.log("Public path set to:", window.__webpack_public_path__);
      } else {
        console.error(
          "widget.uwaUrl does not contain a valid path:",
          widget.uwaUrl
        );
        window.__webpack_public_path__ = "./"; // Fallback value
      }
    } else {
      console.error(
        "widget.uwaUrl is undefined. Falling back to default public path."
      );
      window.__webpack_public_path__ = "./"; // Fallback value
    }
  };

  if (window.widget) {
    console.log("Widget object exists, using it.");
    console.log("Current DOM:", document); // Log DOM structure
    console.log(
      "Available widget container:",
      window.widget.getContainer?.() || "No container found"
    ); // Log container
    updatePublicPath();
    cbOk(window.widget);
  } else if (!window.UWA) {
    console.log("Mocking widget object...");
    window.widget = new Widget();
    // this.uwaUrl = window.location.origin + "/";
    console.log("Widget mocked:", window.widget); // Log mocked widget
    console.log("widget.uwaUrl:", window.widget.uwaUrl); // Log widget URL
    let events = {};
    window.addEvent = (event, callback) => {
      events[event] = callback;
      if (event === "onLoad") {
        if (document.readyState === "loading") {
          window.addEventListener("DOMContentLoaded", callback);
        } else {
          callback();
        }
      }
    };
    console.log(window.define, " window.define window.define window.define");
    if (typeof window.define === "undefined") {
      window.define = (name, deps, callback) => {
        console.log(`Defining module: ${name}`);

        if (typeof name !== "string" || !name.trim()) {
          console.error("Module name is invalid or missing.");
          return;
        }

        if (typeof deps === "function") {
          // If deps is a function, it means no dependencies are provided
          callback = deps;
          deps = [];
        }

        if (!Array.isArray(deps)) {
          console.error(
            `Invalid dependencies for module "${name}". Expected an array but got:`,
            deps
          );
          return;
        }

        if (typeof callback !== "function") {
          console.error(
            `Invalid callback for module "${name}". Expected a function but got:`,
            callback
          );
          return;
        }

        try {
          // Simulate dependency resolution
          console.log(`Resolving dependencies for module "${name}":`, deps);
          callback(); // Execute the module definition
          console.log(`Module "${name}" defined successfully.`);
        } catch (error) {
          console.error(`Error while defining module "${name}":`, error);
        }
      };
    } else {
      console.log("Define function is already defined in the environment.");
    }
    console.log(window.define, " window.define window.define window.define");
    loadRequire()
      .then(() => {
        initRequireModules();
        waitFor("requirejs", 10, () => {
          console.log("RequireJS loaded, initializing widget...");
          cbOk(window.widget);
        });
      })
      .catch(cbError);
  } else {
    console.log("Waiting for widget to be injected...");
    waitFor("widget", 10, () => {
      console.log("Widget injected into window object.");
      updatePublicPath();
      cbOk(window.widget);
    });
  }
}

/**
 * Toolbox for 3DDashboard
 */
function Utils() {
  // List of path of the css files to deactivate with the following function
  const widgetDefaultStyleSheets = ["UWA/assets/css/iframe.css"];
  this.disableCSS = (bDeactivate) => {
    // Activate or deactivate widgets default css
    // To re-activate the Default CSS files pass a false boolean, if no parameters are passed it's considered as true
    let disableOptions = true;
    if (typeof bDeactivate === "boolean" && bDeactivate === false) {
      disableOptions = false;
    }
    let styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      const sheet = styleSheets.item(i);
      for (const partialUrlToTest of widgetDefaultStyleSheets) {
        if (sheet.href && sheet.href.indexOf(partialUrlToTest) !== -1) {
          sheet.disabled = disableOptions;
        }
      }
    }
  };
}

export const x3DDashboardUtils = new Utils();
const widgetUtils = {
  x3DDashboardUtils,
};

export default widgetUtils;
