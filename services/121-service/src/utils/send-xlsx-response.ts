import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as XLSX from 'xlsx';

export function sendXlsxReponse(
  array: any[],
  filename: string,
  res: Response,
): void {
  const xls = arrayToXlsx(array);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${toExportFileName(filename)}.xlsx`,
  );
  res.send(xls);
}

export function arrayToXlsx(array: any[]): Buffer {
  if (array.length > 1_000_000) {
    throw new HttpException(
      'Cannot export more than 1,000,000 rows to XLSX, please use a different filter',
      HttpStatus.BAD_REQUEST,
    );
  }
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(array, {
    dense: true,
  });
  const workbook: XLSX.WorkBook = {
    Sheets: { data: worksheet },
    SheetNames: ['data'],
  };
  try {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    if (
      error instanceof RangeError &&
      error.message.includes('Invalid string length')
    ) {
      throw new HttpException(
        'Export too large to generate, please use a different filter',
        HttpStatus.BAD_REQUEST,
      );
    }
    throw error;
  }
}

function toExportFileName(excelFileName: string): string {
  const date = new Date();
  return `${excelFileName}-${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}.xlsx`;
}
