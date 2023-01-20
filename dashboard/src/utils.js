const isNullOrUndefined = (value) => {
  if (typeof value === 'undefined') return true;
  if (value === null) return true;
  return false;
};

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
