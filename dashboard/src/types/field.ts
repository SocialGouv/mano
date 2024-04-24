import { UUIDV4 } from "./uuid";

export type CustomFieldName = string; // `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}`

export type FieldType = "text" | "textarea" | "number" | "date" | "duration" | "date-with-time" | "yes-no" | "enum" | "multi-choice" | "boolean";

export interface CustomField {
  name: CustomFieldName; // `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}`
  label: string;
  type: FieldType;
  enabled: boolean;
  required: boolean;
  showInStats: boolean;
  options?: string[];
  enabledTeams?: UUIDV4[];
  allowCreateOption?: boolean;
}

export interface PredefinedField {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  encrypted?: boolean;
  importable?: boolean;
  filterable?: boolean;
  enabled: boolean;
  enabledTeams?: UUIDV4[];
}

export interface CustomOrPredefinedField extends PredefinedField {}

export interface CustomFieldsGroup {
  name: string;
  fields: CustomField[];
}

export interface FilterableField {
  field: string;
  name: string;
  label: string;
  type: FieldType;
  options: string[];
}
