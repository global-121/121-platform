import { BobFinanceFspInstructions } from '@121-service/src/payments/fsp-integration/bob-finance/dto/bob-finance-fsp-instructions.dto';
import { ExcelFspInstructions } from '@121-service/src/payments/fsp-integration/excel/dto/excel-fsp-instructions.dto';
import { UkrPoshtaFspInstructions } from '@121-service/src/payments/fsp-integration/ukrposhta/dto/ukrposhta-fsp-instructions.dto';

export type CsvInstructions = (
  | BobFinanceFspInstructions
  | UkrPoshtaFspInstructions
  | ExcelFspInstructions
)[];

export class FspInstructions {
  public data?: CsvInstructions | string;
  public fileType?: ExportFileType;
}

export enum ExportFileType {
  csv = 'csv',
  excel = 'excel',
  xml = 'xml',
}
