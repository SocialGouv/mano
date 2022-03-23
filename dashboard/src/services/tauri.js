import { useState, useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';

/*
Tauri Setup and Abstractions

*/
let TauriAPIFs = null;

// the folder located in Desktop, so that when a user wants to delete quickly the cache, he just delete this folder
// we add .nosync so that iCloud doesn't sync it
const MANO_ROOT_DIR = 'mano-data.nosync';

const readFile = async (pathOrFileName) => {
  if (process.env.REACT_APP_IS_TAURI !== 'true') return null;
  const file = await TauriAPIFs?.readTextFile(`${MANO_ROOT_DIR}/${pathOrFileName}`, { dir: TauriAPIFs?.BaseDirectory.Desktop });
  return file;
};

const writeFile = async (contents, pathOrFileName) => {
  if (process.env.REACT_APP_IS_TAURI !== 'true') return null;
  await TauriAPIFs?.writeFile(
    {
      contents,
      path: `${MANO_ROOT_DIR}/${pathOrFileName}`,
    },
    { dir: TauriAPIFs?.BaseDirectory.Desktop }
  );
  const file = await readFile(pathOrFileName);
  return file;
};

export const writeCollection = async (collectionName, data) => writeFile(JSON.stringify(data), `${collectionName}.json`);

export const readFileOrCreateInitFileIfNotExists = async (pathOrFileName, initialContent, debug) => {
  if (process.env.REACT_APP_IS_TAURI !== 'true') return null;
  try {
    if (debug) console.log(`reading ${pathOrFileName}`);
    const file = await readFile(pathOrFileName);
    if (debug) console.log(`file read ! ${file}`);
    return file;
  } catch (e) {
    if (debug) console.log(`error reading ${pathOrFileName}`);
    if (debug) console.log(e);
    if (e.includes('No such file or directory')) {
      if (debug) console.log(`create file ${pathOrFileName}`);
      return writeFile(initialContent, pathOrFileName);
    }
  }
  return null;
};

(async () => {
  if (process.env.REACT_APP_IS_TAURI !== 'true') return null;
  TauriAPIFs = await import('@tauri-apps/api/fs');
  await TauriAPIFs?.createDir(MANO_ROOT_DIR, {
    dir: TauriAPIFs?.BaseDirectory.Desktop,
    recursive: true,
  });
})();
