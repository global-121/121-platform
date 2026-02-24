// This file is used to declare custom matchers for Jest, allowing us to extend
// Jest with custom assertions.
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeHttpExceptionWithStatus(expectedStatus: HttpStatus): R;
    }
  }
}
export {};
