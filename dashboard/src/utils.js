const isNullOrUndefined = (value) => {
  if (typeof value === 'undefined') return true;
  if (value === null) return true;
  return false;
};

const typeOptions = [
  { value: 'text', label: 'Texte' },
  { value: 'textarea', label: 'Zone de texte multi-lignes' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date sans heure' },
  { value: 'date-with-time', label: 'Date avec heure' },
  { value: 'yes-no', label: 'Oui/Non' },
  { value: 'enum', label: 'Choix dans une liste' },
  { value: 'multi-choice', label: 'Choix multiple dans une liste' },
  { value: 'boolean', label: 'Case à cocher' },
];

// Download a file in browser.
function download(file, fileName) {
  if (window.navigator.msSaveOrOpenBlob) {
    //IE11 & Edge
    window.navigator.msSaveOrOpenBlob(file, fileName);
  } else {
    //Other browsers
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }
}

export { download, typeOptions, isNullOrUndefined };
