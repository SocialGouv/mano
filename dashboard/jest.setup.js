// jest.setup.js
global.window = {}; // Mock window object
global.window.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};

global.window.sessionStorage = {
  clear: jest.fn(),
};

global.window.indexedDB = {
  deleteDatabase: jest.fn(() => ({
    onerror: jest.fn(),
    onblocked: jest.fn(),
    onsuccess: jest.fn(),
  })),
};
