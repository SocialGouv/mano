import { dayjsInstance } from '../../services/date';

const sanitizeString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof `${value}` === 'string') return `${value}`;
  return null;
};

const sanitizeNumber = (value) => {
  if (!isNaN(value)) return value;
  if (!isNaN(parseInt(value, 10))) return parseInt(value, 10);
  return null;
};

const sanitizeDate = (value) => {
  // https://stackoverflow.com/a/643827/5225096
  if (typeof value?.getMonth === 'function' || value instanceof dayjsInstance) return value;
  if (!isNaN(new Date(value).getMonth())) return new Date(value);
  return null;
};

const sanitizeYesNo = (value) => {
  value = sanitizeString(value);
  if (!value) return null;
  if (['Oui', 'Non'].includes(value)) return value;
  if (value === 'No') return 'Non';
  if (value === 'Yes') return 'Oui';
  return null;
};

const sanitizeEnum = (value, possibleValues = []) => {
  value = sanitizeString(value);
  if (!value) return null;
  if (possibleValues.includes(value)) return value;
  return null;
};

const sanitizeMultiChoice = (value, possibleValues = []) => {
  // value is either string or array
  if (!Array.isArray(value)) {
    value = sanitizeString(value);
    if (!value) return null;
    value = value.split(',');
  }
  value = value.filter((value) => possibleValues.includes(value));
  if (value.length) return value;
  return null;
};

const sanitizeBoolean = (value) => {
  if (typeof value === 'undefined') return null;
  // We have to handle the case where value is a string (cf: import XLSX users).
  if (typeof value === 'string') {
    if (['true', 'oui', 'yes'].includes(value.toLowerCase())) return true;
    if (['false', 'non', 'no'].includes(value.toLowerCase())) return false;
  }
  return Boolean(value);
};

export function sanitizeFieldValue(field, { v: rawValue, w: formattedText }) {
  if (field.type === 'text') return sanitizeString(rawValue);
  if (field.type === 'textarea') return sanitizeString(rawValue);
  if (field.type === 'number') return sanitizeNumber(rawValue);
  if (field.type === 'date') return sanitizeDate(formattedText);
  if (field.type === 'date-with-time') return sanitizeDate(formattedText);
  if (field.type === 'yes-no') return sanitizeYesNo(rawValue);
  if (field.type === 'enum') return sanitizeEnum(rawValue, field.options);
  if (field.type === 'multi-choice') return sanitizeMultiChoice(rawValue, field.options);
  if (field.type === 'boolean') return sanitizeBoolean(rawValue);
  return rawValue;
}
