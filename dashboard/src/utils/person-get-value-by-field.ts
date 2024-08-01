export function getValueByField<T>(fieldName: string, fieldType: string, value: T): T | string | Array<string> {
  if (!fieldName) return "";
  if (!fieldType) return "";
  if (["yes-no"].includes(fieldType)) {
    if (value === "Oui") return "Oui";
    return "Non";
  }
  if (["boolean"].includes(fieldType)) {
    if (value === true || value === "Oui") return "Oui";
    return "Non";
  }
  if (fieldName === "outOfActiveList") {
    if (value === true) return "Oui";
    return "Non";
  }
  if (fieldType === "multi-choice") {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return ["Non renseigné"];
      }
      return value;
    }
    if (value == null || value === "") {
      return ["Non renseigné"];
    }
    return [String(value)];
  }
  if (value == null || value === "") {
    return "Non renseigné"; // we cover the case of undefined, null, empty string
  }
  if (typeof value === "string" && value?.includes("Choisissez un genre")) return "Non renseigné";
  return value;
}
