export default function copyLogsToSessionStorage() {
  // thank you Claude

  const LOG_KEY = "console_logs";
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Load existing logs from sessionStorage
  let logs = JSON.parse(window.sessionStorage.getItem(LOG_KEY) || "[]");

  // Override the default console.log function
  const originalLog = console.log;
  console.log = function (...args) {
    // Call the original console.log
    originalLog.apply(console, args);

    // Create a log entry
    const logEntry = {
      timestamp: new Date().getTime(),
      message: args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" "),
    };

    // Add the new log entry
    logs.push(logEntry);

    // Remove logs older than 24 hours
    const now = new Date().getTime();
    logs = logs.filter((log) => now - log.timestamp < MAX_AGE);

    // Save updated logs to sessionStorage
    window.sessionStorage.setItem(LOG_KEY, JSON.stringify(logs));
  };

  // Function to retrieve logs
  window.getConsoleLogs = function (hours = 24) {
    const now = new Date().getTime();
    const filtered = logs.filter((log) => now - log.timestamp < hours * 60 * 60 * 1000);
    return filtered.map((log) => `[${new Date(log.timestamp).toISOString()}] ${log.message}`).join("\n");
  };

  // Function to clear logs
  window.clearConsoleLogs = function () {
    logs = [];
    window.sessionStorage.removeItem(LOG_KEY);
    console.log("Console logs cleared");
  };

  console.log("Console log tracker initialized");
}
