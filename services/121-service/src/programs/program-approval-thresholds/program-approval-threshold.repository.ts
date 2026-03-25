import { InjectRepository } from '@nestjs/typeorm';
import { Equal, LessThanOrEqual, Repository } from 'typeorm';

import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';

export class ProgramApprovalThresholdRepository extends Repository<ProgramApprovalThresholdEntity> {
  constructor(
    @InjectRepository(ProgramApprovalThresholdEntity)
    private readonly baseRepository: Repository<ProgramApprovalThresholdEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getThresholdsForPaymentAmount({
    programId,
    totalPaymentAmount,
  }: {
    programId: number;
    totalPaymentAmount: number;
  }): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.find({
      where: {
        programId: Equal(programId),
        thresholdAmount: LessThanOrEqual(totalPaymentAmount),
      },
      relations: ['approverAssignments'],
      order: { thresholdAmount: 'ASC' },
    });
  }
}
