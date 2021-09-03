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

export { toFrenchDate, generatePassword };
