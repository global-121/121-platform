import { ExcelFspInstructions } from '@121-service/src/payments/fsp-integration/excel/dto/excel-fsp-instructions.dto';

export type CsvInstructions = ExcelFspInstructions[];

export class FspInstructions {
  public data?: CsvInstructions | string;
  public fileType?: ExportFileType;
}

export enum ExportFileType {
  csv = 'csv',
  excel = 'excel',
  xml = 'xml',
}
