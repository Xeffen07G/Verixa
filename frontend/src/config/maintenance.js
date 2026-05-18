// Centralized environment-controlled deployment flag for maintenance mode
// Defaults to true (locked) unless explicitly configured to 'false' via environment variables
let isMaintenanceActive = true;

const envVal = process.env.REACT_APP_MAINTENANCE_MODE;

if (envVal !== undefined && String(envVal).toLowerCase() === 'false') {
  isMaintenanceActive = false;
}

export const MAINTENANCE_MODE = isMaintenanceActive;
