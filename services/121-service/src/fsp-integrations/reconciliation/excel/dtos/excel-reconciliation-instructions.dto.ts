import { ExcelFspInstructions } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-instructions.dto';

export class ExcelReconciliationInstructions {
  public data: ExcelFspInstructions[];
  public fileNamePrefix: string;
}
