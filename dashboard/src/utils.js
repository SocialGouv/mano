const toFrenchDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' });
};

const generatePassword = () => {
  let length = 6;
  let charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};
/*

CUSTOM FIELDS
VALIDATION FIELDS

*/

const isNullOrUndefined = (value) => {
  if (typeof value === 'undefined') return true;
  if (value === null) return true;
  return false;
};

const validateString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof `${value}` === 'string') return `${value}`;
  return null;
};

const validateNumber = (value) => {
  if (!isNaN(value)) return value;
  if (!isNaN(parseInt(value, 10))) return parseInt(value, 10);
  return null;
};

const validateDate = (value) => {
  // https://stackoverflow.com/a/643827/5225096
  if (typeof value?.getMonth === 'function') return value;
  if (!isNaN(new Date(value).getMonth())) return new Date(value);
  return null;
};

const validateYesNo =
  (possibleValues = ['Oui', 'Non']) =>
  (value) => {
    value = validateString(value);
    if (!value) return null;
    if (possibleValues.includes(value)) return value;
    if (value === 'No') return 'Non';
    if (value === 'Yes') return 'Oui';
    return null;
  };

const validateEnum =
  (possibleValues = []) =>
  (value) => {
    value = validateString(value);
    if (!value) return null;
    if (possibleValues.includes(value)) return value;
    return null;
  };

const validateMultiChoice =
  (possibleValues = []) =>
  (value) => {
    // value is either string or array
    if (!Array.isArray(value)) {
      value = validateString(value);
      if (!value) return null;
      value = value.split(',');
    }
    value = value.filter((value) => possibleValues.includes(value));
    if (value.length) return value;
    return null;
  };

const validateBoolean = (value) => {
  if (typeof value === 'undefined') return null;
  return Boolean(value);
};

const typeOptions = [
  { value: 'text', label: 'Texte', validator: validateString },
  { value: 'textarea', label: 'Zone de texte multi-lignes', validator: validateString },
  { value: 'number', label: 'Nombre', validator: validateNumber },
  { value: 'date', label: 'Date sans heure', validator: validateDate },
  { value: 'date-with-time', label: 'Date avec heure', validator: validateDate },
  { value: 'yes-no', label: 'Oui/Non', validator: validateYesNo },
  { value: 'enum', label: 'Choix dans une liste', validator: validateEnum },
  { value: 'multi-choice', label: 'Choix multiple dans une liste', validator: validateMultiChoice },
  { value: 'boolean', label: 'Case à cocher', validator: validateBoolean },
];

export {
  toFrenchDate,
  generatePassword,
  typeOptions,
  isNullOrUndefined,
  validateString,
  validateNumber,
  validateDate,
  validateYesNo,
  validateEnum,
  validateMultiChoice,
  validateBoolean,
};
