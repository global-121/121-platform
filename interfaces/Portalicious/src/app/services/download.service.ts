import { Injectable } from '@angular/core';

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

  downloadCSV({ file, filename }: { file: string[]; filename: string }) {
    const csvContents = file.join(';') + '\r\n';

    this.downloadFile({
      file: new Blob([csvContents], { type: 'text/csv' }),
      filename: `${filename}.csv`,
    });
  }
}
