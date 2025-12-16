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
      filename: ExportService.toExportFileName(filename, 'csv'),
    });
  }

  async downloadArrayToXlsx({
    data,
    fileName,
  }: {
    data: Record<string, unknown>[];
    fileName: string;
  }) {
    const { utils: XLSXUtils, writeFile: writeXLSX } =
      await import('~/utils/xlsx-wrapper');
    const worksheet = XLSXUtils.json_to_sheet(data, {
      header: Object.keys(data[0] ?? {}).sort((keyA, keyB) => {
        // these are keys we want to appear in xlsx exports first, in this order
        const order = ['id', 'referenceId', 'name', 'amount'];
        const indexA = order.indexOf(keyA);
        const indexB = order.indexOf(keyB);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) {
          return -1;
        }
        if (indexB !== -1) {
          return 1;
        }

        // if neither key is in the order list, sort alphabetically, to get consistent (especially test) results
        return keyA.localeCompare(keyB);
      }),
    });
    const workbook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    writeXLSX(workbook, ExportService.toExportFileName(fileName, 'xlsx'));
  }
}
