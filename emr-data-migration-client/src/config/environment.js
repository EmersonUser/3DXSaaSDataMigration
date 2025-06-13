const DEFAULT = {
    VITE_API_URL: "https://emr-data-migration-dev-server.azurewebsites.net",
    VITE_API_URL_LOCAL: "http://localhost:8086"
  };
  
  export const environment = {
    ...DEFAULT,
    ...import.meta.env
  };
  