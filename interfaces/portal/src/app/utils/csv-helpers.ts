import Papa from 'papaparse';

// Without a BOM, Excel opens ".csv" files using the OS ANSI code page instead of
// UTF-8, garbling accented characters; the BOM makes Excel recognize and preserve UTF-8.
const UTF8_BOM = '\uFEFF';

export const unknownArrayToCsvBlob = (data: unknown[]): Blob => {
  // We need to account for not all objects having the same attributes.
  const columns = new Set<string>();
  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item as Record<string, unknown>).forEach((key) => {
          columns.add(key);
        });
      }
    });
  }
  const columnsArray = Array.from(columns);

  // Still default to "just parse it" if we couldn't figure out the columns.
  const csvContent = Papa.unparse(data, {
    columns: columnsArray.length > 0 ? columnsArray : undefined,
  });
  const blob = new Blob([UTF8_BOM, csvContent], {
    type: 'text/csv',
  });
  return blob;
};
