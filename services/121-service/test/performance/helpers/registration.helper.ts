export type JsonRecord = Readonly<Record<string, unknown>>;

export function jsonToCsv(data: JsonRecord[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const item of data) {
    const row = headers.map((header) => {
      const value = item[header];
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  }
  return csvRows.join('\n');
}
