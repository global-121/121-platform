export const createLocalStorageMock = () => {
  // Needed because we can't reliably spy on localStorage with Firefox.
  const mockLocalStorage = {
    length: jasmine.createSpy('length'),
    clear: jasmine.createSpy('clear'),
    key: jasmine.createSpy('key'),
    getItem: jasmine.createSpy('getItem'),
    setItem: jasmine.createSpy('setItem'),
    removeItem: jasmine.createSpy('removeItem'),
  };
  spyOnProperty(window, 'localStorage', 'get').and.returnValue(
    mockLocalStorage as unknown as Storage,
  );

  return mockLocalStorage;
};
