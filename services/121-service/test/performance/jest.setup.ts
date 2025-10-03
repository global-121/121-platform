// Jest setup for performance tests
// This file runs before each performance test

global.startTime = Date.now();

beforeEach(() => {
  global.startTime = Date.now();
});

afterEach(() => {
  const duration = Date.now() - global.startTime;
  console.log(`Test completed in ${duration}ms`);
});

// Set extended timeouts for performance tests
jest.setTimeout(600_000); // 10 minutes
