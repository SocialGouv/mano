// chore: envoi des logs dans sentry pour tenter de debugger le problème des données d'autres orgas
const debugMixedOrgsBug = [];

export function addToDebugMixedOrgsBug(log) {
  try {
    // Create a log entry
    console.log(log);

    const logEntry = {
      timestamp: new Date().getTime(),
      message: typeof log === "object" ? JSON.stringify(log) : log,
    };

    // Add the new log entry
    debugMixedOrgsBug.push(logEntry);
    // eslint-disable-next-line no-empty
  } catch (_e) {}
}

export function getDebugMixedOrgsBug() {
  return debugMixedOrgsBug;
}
