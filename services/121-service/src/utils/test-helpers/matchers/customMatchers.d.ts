declare global {
  namespace jest {
    interface Matchers<R> {
      toBeHttpExceptionWithStatus(expectedStatus: HttpStatus): R;
    }
  }
}
export {};
