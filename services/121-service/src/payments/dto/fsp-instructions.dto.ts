import { ExcelFspInstructions } from '@121-service/src/payments/fsp-integration/excel/dto/excel-fsp-instructions.dto';

export class FspInstructions {
  public data: ExcelFspInstructions[] | string;
  public fileType: ExportFileType;
  public fileNamePrefix: string;
}

export enum ExportFileType {
  csv = 'csv',
  excel = 'excel',
}
