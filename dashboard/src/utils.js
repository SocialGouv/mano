const isNullOrUndefined = (value) => {
  if (typeof value === 'undefined') return true;
  if (value === null) return true;
  return false;
};

export const looseUuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export const cryptoHexRegex = /^[A-Fa-f0-9]{16,128}$/;
export const positiveIntegerRegex = /^\d+$/;
export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

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

export { download, isNullOrUndefined };
