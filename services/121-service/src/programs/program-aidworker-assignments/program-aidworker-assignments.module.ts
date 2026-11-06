import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { ProgramAidworkerAssignmentRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.repository';
import { ProgramAidworkerAssignmentAccessGroupEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.entity';
import { ProgramAidworkerAssignmentAccessGroupRepository } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment-access-group.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramAidworkerAssignmentEntity,
      ProgramAidworkerAssignmentAccessGroupEntity,
    ]),
  ],
  providers: [
    ProgramAidworkerAssignmentRepository,
    ProgramAidworkerAssignmentAccessGroupRepository,
  ],
  exports: [
    ProgramAidworkerAssignmentRepository,
    ProgramAidworkerAssignmentAccessGroupRepository,
  ],
})
export class ProgramAidworkerAssignmentsModule {}
