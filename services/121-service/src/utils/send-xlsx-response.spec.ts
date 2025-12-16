import * as XLSX from 'xlsx';

import { arrayToXlsx } from '@121-service/src/utils/send-xlsx-response';

// Mock the entire XLSX module
jest.mock('xlsx', () => ({
  __esModule: true,
  ...jest.requireActual('xlsx'),
  write: jest.fn(),
}));

const mockXLSX = XLSX as jest.Mocked<typeof XLSX>;

describe('arrayToXlsx', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should convert array to XLSX buffer', () => {
    // Arrange
    const originalWrite = jest.requireActual('xlsx').write;
    mockXLSX.write.mockImplementation(originalWrite);

    const testData = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'Boston' },
      { name: 'Bob', age: 35, city: 'Chicago' },
    ];

    // Act
    const result = arrayToXlsx(testData);

    // Assert
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
    const workbook = XLSX.read(result, { type: 'buffer' });
    expect(workbook.SheetNames).toEqual(['data']);
    const worksheet = workbook.Sheets['data'];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    expect(jsonData).toEqual(testData);
  });

  it('should throw HttpException when array has more than 1,000,000 rows', () => {
    // Arrange
    const largeArray = new Array(1_000_001).fill({ test: 'data' });

    // Act & Assert
    expect(() => arrayToXlsx(largeArray)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot export more than 1,000,000 rows to XLSX, please use a different filter"`,
    );
  });

  it('should handle array with exactly 1,000,000 rows', () => {
    // Arrange
    const originalWrite = jest.requireActual('xlsx').write;
    mockXLSX.write.mockImplementation(originalWrite);

    const maxArray = new Array(1_000_000).fill({ test: 'data' });

    // Act
    const result = arrayToXlsx(maxArray);

    // Assert
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should throw specific HttpException for RangeError with "Invalid string length"', () => {
    // Arrange
    const testData = [{ test: 'data' }];
    const mockRangeError = new RangeError('Invalid string length');

    // Mock XLSX.write to throw RangeError with specific message
    mockXLSX.write.mockImplementation(() => {
      throw mockRangeError;
    });

    // Act & Assert
    expect(() => arrayToXlsx(testData)).toThrowErrorMatchingInlineSnapshot(
      `"Export too large to generate, please use a different filter"`,
    );
  });

  it('should re-throw non-RangeError exceptions', () => {
    // Arrange
    const testData = [{ test: 'data' }];
    const mockError = new Error('Some random error');

    // Mock XLSX.write to throw a random error
    mockXLSX.write.mockImplementation(() => {
      throw mockError;
    });

    // Act & Assert
    expect(() => arrayToXlsx(testData)).toThrow(mockError);
  });
});
