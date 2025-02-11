import { Injectable } from '@angular/core';

import { ExportService } from '~/services/export.service';

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

  async downloadUnknownArrayToCSV({
    file,
    filename,
  }: {
    file: unknown[];
    filename: string;
  }) {
    const XLSX = await import('~/utils/xlsx-wrapper');
    const worksheet = XLSX.utils.json_to_sheet(file);
    const csvContents = XLSX.utils.sheet_to_csv(worksheet);

    this.downloadFile({
      file: new Blob([csvContents], { type: 'text/csv' }),
      filename: `${filename}.csv`,
    });
  }

  async downloadArrayToXlsx({
    data,
    fileName,
  }: {
    data: unknown[];
    fileName: string;
  }) {
    const XLSX = await import('~/utils/xlsx-wrapper');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    XLSX.writeFile(workbook, ExportService.toExportFileName(fileName));
  }
}
