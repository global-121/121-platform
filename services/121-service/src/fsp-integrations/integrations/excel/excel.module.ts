import { Module } from '@nestjs/common';

import { ExcelService } from '@121-service/src/fsp-integrations/integrations/excel/excel.service';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';

@Module({
  imports: [ProgramFspConfigurationsModule],
  providers: [ExcelService],
  controllers: [],
  exports: [ExcelService],
})
export class ExcelModule {}
