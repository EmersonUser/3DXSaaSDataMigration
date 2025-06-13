const DEFAULT = {
    ENOVIA_RESOURCES_API_URL: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources",
    VITE_API_URL_LOCAL: "http://localhost:8086",
    VITE_API_URL_DEV: "https://oi000186152-us1-space.3dexperience.3ds.com",
    VITE_API_EXTENSION: "enovia/resources/v1/modeler/documents",
    CHECK_IN_URL: "https://stg001us1-dfcs.3dexperience.3ds.com",
    CHECK_IN_EXTENSION: "fcs/servlet/fcs/checkin"
  };
  
  export const environment = {
    ...DEFAULT,
    ...import.meta.env
  };
  