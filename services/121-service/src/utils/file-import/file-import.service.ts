import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'typeorm/platform/PlatformTools';
import * as convert from 'xml-js';

@Injectable()
export class FileImportService {
  public async validateCsv(csvFile, maxRecords?: number): Promise<object[]> {
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

  public async validateXml(
    xmlFile,
  ): Promise<convert.Element | convert.ElementCompact> {
    const indexLastPoint = xmlFile.originalname.lastIndexOf('.');
    const extension = xmlFile.originalname.substr(
      indexLastPoint,
      xmlFile.originalname.length - indexLastPoint,
    );
    if (extension !== '.xml') {
      const errors = [`Wrong file extension. It should be .xml`];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    const importRecords = await this.xmlBufferToArray(xmlFile.buffer);
    return importRecords;
  }

  private async csvBufferToArray(buffer, separator): Promise<object[]> {
    const stream = new Readable();
    stream.push(buffer.toString());
    stream.push(null);
    const parsedData: object[] = [];
    return await new Promise((resolve, reject): void => {
      stream
        .pipe(csv({ separator: separator }))
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

  private async xmlBufferToArray(
    buffer,
  ): Promise<convert.Element | convert.ElementCompact> {
    const xml = convert.xml2js(buffer.toString());
    return xml.elements[0].elements.find((el) => el.name === 'Records')
      .elements;
  }

  public checkForCompletelyEmptyRow(row): boolean {
    if (Object.keys(row).every((key) => !row[key])) {
      return true;
    }
    return false;
  }
}
