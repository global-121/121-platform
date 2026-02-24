import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

const createCsvFile = (csvContents: string, filename = 'test.csv') => {
  const buffer = Buffer.from(csvContents);
  return {
    buffer,
    originalname: filename,
  } as Express.Multer.File;
};

describe('FileImportService', () => {
  let service: FileImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileImportService],
    }).compile();

    service = module.get<FileImportService>(FileImportService);
  });

  describe('validateCsv', () => {
    // Happy path
    it("return imported records when there's no problem", async () => {
      const file = createCsvFile('a,b,c\n1,2,3');
      const result = await service.validateCsv(file);
      expect(result).toEqual([{ a: '1', b: '2', c: '3' }]);
    });

    it('should throw if file extension is not .csv', async () => {
      // Arrange
      const file = createCsvFile('a,b,c\n1,2,3', 'test.txt');

      // Act
      let error: HttpException | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.validateCsv(file);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response[0]).toBe('Wrong file extension. It should be .csv');
    });

    it('should throw on invalid csv file contents - 0 lines', async () => {
      // Arrange
      const invalidCsvFile = createCsvFile('');

      // Act
      let error: HttpException | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.validateCsv(invalidCsvFile);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response).toBe('Could not parse CSV file, please check it');
    });

    it('should throw on invalid csv file contents - 1 line', async () => {
      // Arrange
      const invalidCsvFile = createCsvFile('abc');

      // Act
      let error: HttpException | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.validateCsv(invalidCsvFile);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response).toBe('Could not parse CSV file, please check it');
    });

    it('should throw when we import a CSV with too many rows', async () => {
      // Arrange
      const csv100Rows = createCsvFile(`a,b,c\n${'1,2,3\n'.repeat(100)}`);

      // Act
      let error: HttpException | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.validateCsv(csv100Rows, 50);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response[0]).toBe(
        'Too many records. Maximum number of records is 50. You have 100 records.',
      );
    });
  });
});
