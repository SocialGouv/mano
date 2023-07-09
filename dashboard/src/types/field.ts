export type CustomFieldName = string; // `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}`

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'date-with-time' | 'yes-no' | 'enum' | 'multi-choice' | 'boolean';

export interface CustomField {
  name: CustomFieldName; // `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}`
  label: string;
  type: FieldType;
  enabled: boolean;
  required: boolean;
  showInStats: boolean;
  options?: string[];
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
}
