import { Injectable } from '@angular/core';

import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  downloadFile({ file, filename }: { file: Blob; filename: string }) {
    const downloadURL = window.URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadURL;
    link.download = filename;
    link.click();
  }

  downloadStringArrayToCSV({
    file,
    filename,
  }: {
    file: string[];
    filename: string;
  }) {
    const csvContents = file.join(';') + '\r\n';

    this.downloadFile({
      file: new Blob([csvContents], { type: 'text/csv' }),
      filename: `${filename}.csv`,
    });
  }

  downloadUnknownArrayToCSV({
    file,
    filename,
  }: {
    file: unknown[];
    filename: string;
  }) {
    const worksheet = XLSX.utils.json_to_sheet(file);
    const csvContents = XLSX.utils.sheet_to_csv(worksheet);

    this.downloadFile({
      file: new Blob([csvContents], { type: 'text/csv' }),
      filename: `${filename}.csv`,
    });
  }
}
