import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';

export class ProgramApprovalThresholdRepository extends Repository<ProgramApprovalThresholdEntity> {
  constructor(
    @InjectRepository(ProgramApprovalThresholdEntity)
    private readonly repository: Repository<ProgramApprovalThresholdEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
