import { saveAs } from 'file-saver';

export function arrayToCsv(array: any[]): string {
  if (array.length === 0) {
    return '';
  }

  // TODO: All logic below could be replaced by using the `aoa_to_sheet`+`sheet_to_csv`-helpers from the 'XLSX' package;
  // See also: `./array-to-xlsx.ts`
  const columns = Object.keys(array[0]);

  const rows = array.map((row) =>
    columns.map((fieldName) => JSON.stringify(row[fieldName] || '')).join(','),
  );

  rows.unshift(columns.join(',')); // Add header row

  return rows.join('\r\n');
}

export function downloadAsCsv(array: any[], filename: string): void {
  const csvFileString = arrayToCsv(array);

  saveAs(
    new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvFileString], {
      type: 'text/csv;charset=utf-8',
    }),
    `${filename}-${new Date().toISOString().substring(0, 10)}.csv`,
  );
}
