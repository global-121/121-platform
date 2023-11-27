import { saveAs } from 'file-saver';

export function downloadAsXml(xmlText: string, filename: string): void {
  saveAs(
    new Blob([xmlText], { type: 'application/xml' }),
    `${filename}-${new Date().toISOString().substring(0, 10)}.xml`,
  );
}
