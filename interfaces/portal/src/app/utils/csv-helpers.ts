import Papa from 'papaparse';

export const unknownArrayToCsvBlob = (data: unknown[]): Blob => {
  const csvContent = Papa.unparse(data);
  const blob = new Blob([csvContent], {
    type: 'text/csv',
  });
  return blob;
};
