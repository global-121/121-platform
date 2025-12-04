import { ExcelFspInstructions } from '@121-service/src/fsp-integrations/api-integrations/excel/dto/excel-fsp-instructions.dto';

export class FspInstructions {
  public data: ExcelFspInstructions[];
  public fileNamePrefix: string;
}
