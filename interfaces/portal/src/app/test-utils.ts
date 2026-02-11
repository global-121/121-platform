export const createLocalStorageMock = () => {
  const storageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0,
  };
  Object.defineProperty(window, 'localStorage', {
    value: storageMock,
    writable: true,
  });
  return storageMock;
};
