import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessGroupLevelEntity } from '@121-service/src/programs/access-group-levels/access-group-level.entity';
import { AccessGroupLevelRepository } from '@121-service/src/programs/access-group-levels/access-group-level.repository';
import { AccessGroupLevelsService } from '@121-service/src/programs/access-group-levels/access-group-levels.service';
import { ProgramAidworkerAssignmentsModule } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignments.module';
import { ProgramAttachmentsModule } from '@121-service/src/programs/program-attachments/program-attachments.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessGroupLevelEntity]),
    RegistrationDataModule,
    ProgramAidworkerAssignmentsModule,
    ProgramAttachmentsModule,
  ],
  providers: [AccessGroupLevelsService, AccessGroupLevelRepository],
  exports: [AccessGroupLevelsService, AccessGroupLevelRepository],
})
export class AccessGroupLevelsModule {}
