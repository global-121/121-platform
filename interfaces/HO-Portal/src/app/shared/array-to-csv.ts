import { saveAs } from 'file-saver';

export function arrayToCsv(array: any[], filename: string): string {
  if (array.length === 0) {
    return '';
  }

  const columns = Object.keys(array[0]);

  const rows = array.map((row) =>
    columns.map((fieldName) => JSON.stringify(row[fieldName] || '')).join(','),
  );

  rows.unshift(columns.join(',')); // Add header row

  saveAs(
    new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), rows.join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    }),
    `${filename}-${new Date().toISOString().substr(0, 10)}.csv`,
  );
}
