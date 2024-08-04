// chore: envoi des logs dans sentry pour tenter de debugger le problème des données d'autres orgas
export default function copyLogsToSessionStorage() {
  try {
    const LOG_KEY = "console_logs";
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Load existing logs from sessionStorage
    let logs = JSON.parse(window.sessionStorage.getItem(LOG_KEY) || "[]");

    // Override the default console.log function
    const originalLog = console.log;
    console.log = function (...args) {
      // Call the original console.log
      originalLog.apply(console, args);

      try {
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
      } catch (error) {
        if (error.name === "QuotaExceededError") {
          originalLog("Storage quota exceeded. Clearing all logs.");
          logs = []; // Clear all logs
          window.sessionStorage.removeItem(LOG_KEY);
        } else {
          throw error; // Re-throw if it's not a QuotaExceededError
        }
      }
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
  } catch (error) {
    console.error("Error initializing console log tracker:", error);
  }
}
