// Centralized environment-controlled deployment flag for maintenance mode
// Supports both Webpack/Create React App (process.env) and Vite (import.meta.env)
const rawMode = process.env.REACT_APP_MAINTENANCE_MODE !== undefined 
  ? process.env.REACT_APP_MAINTENANCE_MODE 
  : (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAINTENANCE_MODE !== undefined 
      ? import.meta.env.VITE_MAINTENANCE_MODE 
      : 'true');

export const MAINTENANCE_MODE = rawMode === "true";
