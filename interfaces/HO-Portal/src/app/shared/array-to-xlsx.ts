import * as XLSX from 'xlsx';

export function arrayToXlsx(array: any[], filename: string): void {
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(array);
  const workbook: XLSX.WorkBook = {
    Sheets: { data: worksheet },
    SheetNames: ['data'],
  };
  XLSX.writeFile(workbook, toExportFileName(filename));
}

function toExportFileName(excelFileName: string): string {
  const date = new Date();
  return `${excelFileName}_${
    date.getMonth() + 1
  }-${date.getDate()}-${date.getFullYear()}.xlsx`;
}
