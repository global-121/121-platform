import { Response } from 'express';
import * as XLSX from 'xlsx';
import * as zlib from 'zlib';

// Use compression and chunks to write into xls
// for each data sheet of xlsx file to avoid memory error
const CHUNK_SIZE = 300000;
XLSX.CFB.utils.use_zlib(zlib);

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
  const workbook = XLSX.utils.book_new();

  let dataSheet = 1;
  for (let index = 0; index < array.length; index += CHUNK_SIZE) {
    const chunk = array.slice(index, index + CHUNK_SIZE);
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(chunk, {
      dense: true,
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, `data_${dataSheet++}`);
  }

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true,
    bookSST: true,
  });
}

function toExportFileName(excelFileName: string): string {
  const date = new Date();
  return `${excelFileName}-${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}.xlsx`;
}
