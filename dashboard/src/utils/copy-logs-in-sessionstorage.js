// chore: envoi des logs dans sentry pour tenter de debugger le problème des données d'autres orgas

window.sessionStorage.removeItem("custom_logs"); // previous key was "custom_logs" but now it's full of logs so we clear it for the new key

export function saveLogToSessionStorage(...args) {
  const LOG_KEY = "logs_for_debugging_purpose";
  const MAX_ENTRIES = 20;

  try {
    // Load existing logs from sessionStorage
    let logs = JSON.parse(window.sessionStorage.getItem(LOG_KEY) || "[]");

    // Create a log entry
    const logEntry = {
      timestamp: new Date().getTime(),
      message: args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" "),
    };

    // Add the new log entry
    logs.push(logEntry);

    // Keep only the latest 20 entries
    if (logs.length > MAX_ENTRIES) {
      logs = logs.slice(-MAX_ENTRIES);
    }

    // Save updated logs to sessionStorage
    window.sessionStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    if (error.name === "QuotaExceededError") {
      console.warn("Storage quota exceeded. Unable to save log to sessionStorage.");
    } else {
      console.error("Error saving log to sessionStorage:", error);
    }
  }
}

export function getLogsFromSessionStorage() {
  const LOG_KEY = "custom_logs";
  const logs = JSON.parse(window.sessionStorage.getItem(LOG_KEY) || "[]");
  return logs.map((log) => `[${new Date(log.timestamp).toISOString()}] ${log.message}`).join("\n");
}

export function clearLogsFromSessionStorage() {
  const LOG_KEY = "custom_logs";
  window.sessionStorage.removeItem(LOG_KEY);
  console.log("Logs cleared from sessionStorage");
}
