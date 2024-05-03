import { saveAs } from 'file-saver';
import { getFullISODate } from './utils/get-iso-date.util';

export function downloadAsXml(xmlText: string, filename: string): void {
  saveAs(
    new Blob([xmlText], { type: 'application/xml' }),
    `${filename}-${getFullISODate(new Date())}.xml`,
  );
}
