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

  public async deleteThresholdsForProgram(programId: number): Promise<void> {
    await this.baseRepository.delete({
      programId: Equal(programId),
    });
  }

  public async saveThreshold(
    threshold: ProgramApprovalThresholdEntity,
  ): Promise<ProgramApprovalThresholdEntity> {
    return await this.baseRepository.save(threshold);
  }

  public async getThresholdAmount(thresholdId: number): Promise<number | null> {
    const threshold = await this.findOne({
      where: { id: Equal(thresholdId) },
      select: ['thresholdAmount'],
    });
    return threshold?.thresholdAmount ?? null;
  }

  public async findThresholdsWithRelations(
    programId: number,
  ): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.baseRepository.find({
      where: { programId: Equal(programId) },
      relations: {
        approverAssignments: {
          user: true,
        },
      },
      order: { thresholdAmount: 'ASC' },
    });
  }

  public async getThresholdsForPaymentAmount(
    programId: number,
    paymentAmount: number,
  ): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.find({
      where: {
        programId: Equal(programId),
        thresholdAmount: LessThanOrEqual(paymentAmount),
      },
      relations: ['approverAssignments'],
      order: { thresholdAmount: 'ASC' },
    });
  }

  public async getProgramApprovalThresholds(
    programId: number,
  ): Promise<ProgramApprovalThresholdEntity[]> {
    return await this.find({
      where: { programId: Equal(programId) },
      order: { thresholdAmount: 'ASC' },
      relations: {
        approverAssignments: {
          user: true,
        },
      },
    });
  }
}
