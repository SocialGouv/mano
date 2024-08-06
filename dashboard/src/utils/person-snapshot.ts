import structuredClone from "@ungap/structured-clone";
import { capture } from "../services/sentry";
import type { PersonPopulated } from "../types/person";
import type { CustomOrPredefinedField } from "../types/field";
import { dayjsInstance } from "../services/date";
import { getValueByField } from "./person-get-value-by-field";
import { forbiddenPersonFieldsInHistory } from "../recoil/persons";

export function getPersonSnapshotAtDate({
  person,
  snapshotDate,
  typesByFields,
  onlyForFieldName,
  replaceNullishWithNonRenseigne = false,
}: {
  person: PersonPopulated;
  snapshotDate: string; // YYYY-MM-DD
  typesByFields: Record<CustomOrPredefinedField["name"], CustomOrPredefinedField["type"]>;
  onlyForFieldName?: CustomOrPredefinedField["name"];
  replaceNullishWithNonRenseigne?: boolean;
}): PersonPopulated | null {
  if (!person.history?.length) {
    return person;
  }
  if (!snapshotDate) {
    return person;
  }
  const reversedHistory = [...person.history].reverse();
  let snapshot = structuredClone(person);
  for (const historyItem of reversedHistory) {
    const historyDate = dayjsInstance(historyItem.date).format("YYYY-MM-DD");
    // history is: before the date
    // snapshot is: after the date
    // what should we do for a history change on the same day as the snapshot ?
    // 2 options: we keep the snapshot, or we keep the history change
    // we keep the snapshot because it's more coherent with L258-L259
    if (historyDate <= snapshotDate) {
      return snapshot; // if snapshot's day is history's day, we return the snapshot
    }
    for (const fieldName of Object.keys(historyItem.data)) {
      if (forbiddenPersonFieldsInHistory.includes(fieldName)) continue;
      if (onlyForFieldName && fieldName !== onlyForFieldName) continue; // we support only one indicator for now
      if (!typesByFields[fieldName]) continue; // this is a deleted custom field
      const oldValue = replaceNullishWithNonRenseigne
        ? getValueByField(fieldName, typesByFields[fieldName], historyItem.data[fieldName].oldValue)
        : historyItem.data[fieldName].oldValue;
      const historyNewValue = replaceNullishWithNonRenseigne
        ? getValueByField(fieldName, typesByFields[fieldName], historyItem.data[fieldName].newValue)
        : historyItem.data[fieldName].newValue;
      const currentPersonValue = replaceNullishWithNonRenseigne
        ? getValueByField(fieldName, typesByFields[fieldName], snapshot[fieldName])
        : snapshot[fieldName];
      if (JSON.stringify(historyNewValue) !== JSON.stringify(currentPersonValue)) {
        capture(new Error("Incoherent snapshot history 3"), {
          extra: {
            historyItem,
            fieldName,
            oldValue,
            historyNewValue,
            currentPersonValue,
            snapshotDate,
            // person: process.env.NODE_ENV === "development" ? person : undefined,
            // snapshot: process.env.NODE_ENV === "development" ? snapshot : undefined,
          },
          tags: {
            personId: person._id,
            fieldName,
          },
        });
      }
      if (oldValue === "") continue;
      snapshot = {
        ...snapshot,
        [fieldName]: oldValue,
      };
    }
  }
  return snapshot;
}
