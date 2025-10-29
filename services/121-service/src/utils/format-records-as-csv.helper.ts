export type CSVRecord = Record<string, string>;

export const formatRecordsAsCsv = (records: CSVRecord[]): string => {
  const keyNames = Object.keys(records[0] || {});
  const csvHeader = keyNames.join(',') + '\n';

  const csvRows = records
    .map((record) => {
      for (const key of keyNames) {
        record[key] = escapeCsvValue(String(record[key]));
      }
      return keyNames.map((key) => record[key]).join(',');
    })
    .join('\n');

  const csvString = csvHeader + csvRows + '\n';
  const contentBytes = Buffer.from(csvString, 'utf8').toString('base64');
  return contentBytes;
};

export const escapeCsvValue = (value: string): string => {
  const needsQuoting =
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');
  let escaped = value.replace(/"/g, '""');
  if (needsQuoting) {
    escaped = `"${escaped}"`;
  }
  return escaped;
};
