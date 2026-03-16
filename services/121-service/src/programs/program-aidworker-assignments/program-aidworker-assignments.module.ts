import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { ProgramAidworkerAssignmentRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramAidworkerAssignmentEntity])],
  providers: [ProgramAidworkerAssignmentRepository],
  exports: [ProgramAidworkerAssignmentRepository],
})
export class ProgramAidworkerAssignmentsModule {}
