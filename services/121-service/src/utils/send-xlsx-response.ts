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

function arrayToXlsx(array: any[]): Buffer {
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(array);
  const workbook: XLSX.WorkBook = {
    Sheets: { data: worksheet },
    SheetNames: ['data'],
  };
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function toExportFileName(excelFileName: string): string {
  const date = new Date();
  return `${excelFileName}-${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}.xlsx`;
}
