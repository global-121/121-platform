import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { ProgramAidworkerAssignmentRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.repository';
import { ProgramAidworkerAssignmentsController } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignments.controller';
import { ProgramAidworkerAssignmentsService } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignments.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramAidworkerAssignmentEntity])],
  providers: [
    ProgramAidworkerAssignmentsService,
    ProgramAidworkerAssignmentRepository,
  ],
  controllers: [ProgramAidworkerAssignmentsController],
  exports: [
    ProgramAidworkerAssignmentsService,
    ProgramAidworkerAssignmentRepository,
  ],
})
export class ProgramAidworkerAssignmentsModule {}
