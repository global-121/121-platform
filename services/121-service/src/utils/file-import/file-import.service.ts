import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'typeorm/platform/PlatformTools';

export type CsvContents = Record<
  string,
  string | number | boolean | undefined
>[];

@Injectable()
export class FileImportService {
  public async validateCsv(
    csvFile: Express.Multer.File,
    maxRecords?: number,
  ): Promise<CsvContents> {
    const indexLastPoint = csvFile.originalname.lastIndexOf('.');
    const extension = csvFile.originalname.substr(
      indexLastPoint,
      csvFile.originalname.length - indexLastPoint,
    );
    if (extension !== '.csv') {
      const errors = [`Wrong file extension. It should be .csv`];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    let importRecords = await this.csvBufferToArray(csvFile.buffer, ',');

    // When there are 0 or 1 lines in the file we get an empty array.
    if (importRecords.length === 0) {
      throw new HttpException(
        'Could not parse CSV file, please check it',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (Object.keys(importRecords[0]).length === 1) {
      importRecords = await this.csvBufferToArray(csvFile.buffer, ';');
    }

    if (maxRecords && importRecords.length > maxRecords) {
      const errors = [
        `Too many records. Maximum number of records is ${maxRecords}. You have ${importRecords.length} records.`,
      ];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }
    return importRecords;
  }

  // Excel saves ".csv" files using the OS ANSI code page (e.g. Windows-1252) unless
  // the user explicitly picks "CSV UTF-8", which silently turns accented characters
  // (e.g. é, ë, ô) into "�" if we assumed UTF-8 unconditionally. Rather than guess
  // at the actual encoding (which risks silently writing wrong data), we reject
  // non-UTF-8 files so the user can re-save and re-upload with the correct encoding.
  private decodeCsvBuffer(buffer: Buffer): string {
    let decoded: string;
    try {
      decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (error) {
      // Checked via `name` instead of `instanceof TypeError`: TextDecoder's error
      // isn't guaranteed to share a prototype chain with the local TypeError (e.g.
      // it doesn't in this codebase's Jest setup), which makes instanceof unreliable.
      const errorName = (error as { name?: string } | null | undefined)?.name;
      if (errorName !== 'TypeError') {
        throw error;
      }
      const errors = [
        'This file does not appear to be UTF-8 encoded, which can corrupt special characters (e.g. é, ë, ô). Please save it as "CSV UTF-8" (in Excel: File > Save As > CSV UTF-8 (Comma delimited)) and try again.',
      ];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }
    // Accented characters can be encoded as a single precomposed code point or as a
    // base letter plus a combining accent; both look identical but compare unequal.
    // NFC normalizes to the precomposed form so e.g. matching on Full Name for FSP
    // reconciliation isn't silently broken by the input's normalization form.
    return decoded.normalize('NFC');
  }

  private async csvBufferToArray(
    buffer: Buffer,
    separator: string,
  ): Promise<CsvContents> {
    const stream = new Readable();
    stream.push(this.decodeCsvBuffer(buffer));
    stream.push(null);
    const parsedData: CsvContents = [];
    return await new Promise((resolve, reject): void => {
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
  }

  public checkForCompletelyEmptyRow(row): boolean {
    if (Object.keys(row).every((key) => !row[key])) {
      return true;
    }
    return false;
  }
}
