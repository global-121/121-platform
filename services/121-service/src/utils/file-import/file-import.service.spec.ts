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

// Simulates Excel's default ".csv" export, which uses the OS ANSI code page
// (Windows-1252) instead of UTF-8. Node's "latin1" encoding matches Windows-1252
// for the accented-character range, so it can be used to build this fixture.
const createWindowsAnsiCsvFile = (
  csvContents: string,
  filename = 'test.csv',
) => {
  const buffer = Buffer.from(csvContents, 'latin1');
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

    it('should correctly decode accented characters from a plain UTF-8 file', async () => {
      const file = createCsvFile('name\nDansou Noël');
      const result = await service.validateCsv(file);
      expect(result).toEqual([{ name: 'Dansou Noël' }]);
    });

    it('should throw a clear error when the file is not UTF-8 encoded (e.g. saved with Windows ANSI/Windows-1252)', async () => {
      // Arrange
      const file = createWindowsAnsiCsvFile('name\nDansou Noël');

      // Act
      let error: HttpException | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.validateCsv(file);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response[0]).toContain('UTF-8');
    });

    it('should normalize decomposed accented characters (base letter + combining accent) to their precomposed form', async () => {
      const decomposedNoel = 'Noe\u0308l'; // 'e' + combining diaeresis, instead of precomposed 'ë'
      const file = createCsvFile(`name\nDansou ${decomposedNoel}`);
      const result = await service.validateCsv(file);
      expect(result).toEqual([{ name: 'Dansou Noël' }]);
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
