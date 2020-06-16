export const MockIonicStorage = {
  get: () => new Promise<any>((resolve) => resolve('')),
  set: () => new Promise<any>((resolve) => resolve('')),
  clear: () => new Promise<any>((resolve) => resolve('')),
};
