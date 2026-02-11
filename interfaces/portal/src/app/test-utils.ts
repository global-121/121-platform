/**
 * A Jest fixture that sets up and restores the localStorage mock automatically.
 *
 * @example
 * ```ts
 * describe('MyComponent', () => {
 *   const localStorageMock = useLocalStorageMock();
 *
 *   it('should read from localStorage', () => {
 *     localStorageMock.getItem.mockReturnValue('some-value');
 *     // ... test code
 *     expect(localStorageMock.getItem).toHaveBeenCalledWith('key');
 *   });
 * });
 * ```
 */
export const useLocalStorageMock = () => {
  const originalLocalStorage = window.localStorage;

  const fixture = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0,
    restore: () => {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    },
  };

  beforeEach(() => {
    fixture.getItem.mockReset();
    fixture.setItem.mockReset();
    fixture.removeItem.mockReset();
    fixture.clear.mockReset();
    fixture.key.mockReset();

    Object.defineProperty(window, 'localStorage', {
      value: fixture,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    fixture.restore();
  });

  return fixture;
};
