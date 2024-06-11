type HistoryEntry<T> = {
  date: string;
  data: T;
};

export const cleanHistory = <T>(history: Array<HistoryEntry<T>> = []): Array<HistoryEntry<T>> => {
  const alreadyExisting = {};
  return history.filter((h) => {
    const stringifiedEntry = JSON.stringify(h.data);
    // FIX: there was a bug in history at some point, where the whole person was saved in the history
    // below it removes removes those entries
    if (stringifiedEntry.includes("encryptedEntityKey")) return false;
    // FIX: there was a bug in history at some point, where person's history was saved in the medicalFile history
    // below it removes those duplicated entries
    if (alreadyExisting[`${h.date}-${stringifiedEntry}`]) return false;
    alreadyExisting[`${h.date}-${stringifiedEntry}`] = true;
    return true;
  });
};
