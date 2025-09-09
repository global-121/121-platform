import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'typeorm/platform/PlatformTools';

@Injectable()
export class FileImportService {
  public async validateCsv(
    csvFile: Express.Multer.File,
    maxRecords?: number,
  ): Promise<Record<string, string | number | boolean | undefined>[]> {
    console.log('validateCsv');
    const indexLastPoint = csvFile.originalname.lastIndexOf('.');
    const extension = csvFile.originalname.substr(
      indexLastPoint,
      csvFile.originalname.length - indexLastPoint,
    );
    console.log({ extension });
    if (extension !== '.csv') {
      const errors = [`Wrong file extension. It should be .csv`];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    console.log('validateCsv: 2');
    let importRecords = await this.csvBufferToArray(csvFile.buffer, ',');
    console.log('validateCsv: 3');

    // When there are 0 or 1 lines in the file we get an empty array.
    if (importRecords.length === 0) {
      throw new HttpException(
        'Could not parse CSV file, please check it',
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log('validateCsv: 4');
    if (Object.keys(importRecords[0]).length === 1) {
      importRecords = await this.csvBufferToArray(csvFile.buffer, ';');
    }

    console.log('validateCsv: 5');
    if (maxRecords && importRecords.length > maxRecords) {
      const errors = [
        `Too many records. Maximum number of records is ${maxRecords}. You have ${importRecords.length} records.`,
      ];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }
    console.log('validateCsv: end', importRecords);
    return importRecords;
  }

  private async csvBufferToArray(
    buffer,
    separator,
  ): Promise<Record<string, string | number | boolean | undefined>[]> {
    console.log('csvBufferToArray 1');
    const stream = new Readable();
    stream.push(buffer.toString());
    stream.push(null);
    const parsedData: Record<string, string | number | boolean | undefined>[] =
      [];
    console.log('csvBufferToArray 2');
    const result: Record<string, string | number | boolean | undefined>[] =
      await new Promise((resolve, reject): void => {
        stream
          .pipe(csv({ separator }))
          .on('error', (error): void => reject(error))
          .on('data', (rowData) => {
            // Clean up the keys in rowData
            const cleanedRowData = Object.keys(rowData).reduce((acc, key) => {
              // Use a regex to remove non-printable characters and trim whitespace
              const cleanKey = key.replace(/[^\x20-\x7E]+/g, '').trim();
              acc[cleanKey] = rowData[key];
              return acc;
            }, {});
            parsedData.push(cleanedRowData);
          })
          .on('end', (): void => {
            resolve(parsedData);
          });
      });
    console.log('csvBufferToArray 3');
    return result;
  }

  public checkForCompletelyEmptyRow(row): boolean {
    if (Object.keys(row).every((key) => !row[key])) {
      return true;
    }
    return false;
  }
}
