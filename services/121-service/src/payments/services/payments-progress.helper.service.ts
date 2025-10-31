import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Equal, Repository } from 'typeorm';

import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

@Injectable()
export class PaymentsProgressHelperService {
  @InjectRepository(ProgramEntity)
  private programRepository: Repository<ProgramEntity>;
  public constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async unlockPaymentsForProgram(programId: number): Promise<void> {
    await this.programRepository.update(programId, {
      paymentsAreLocked: false,
    });
  }

  public async checkAndLockPaymentProgressOrThrow({
    programId,
  }: {
    programId: number;
  }): Promise<void> {
    await this.checkPaymentInProgressAndThrow(programId);

    const updateResult = await this.programRepository.update(
      { id: programId, paymentsAreLocked: false },
      { paymentsAreLocked: true },
    );
    // If no rows were affected, it means payments are already locked
    // There is a small timeframe where this can happen after the previous check, but this is to be sure that a payment is not already in progress
    if (updateResult.affected === 0) {
      this.throwPaymentInProgressException();
    }
  }

  public async checkPaymentInProgressAndThrow(
    programId: number,
  ): Promise<void> {
    if (await this.isPaymentInProgress(programId)) {
      this.throwPaymentInProgressException();
    }
  }

  public async isPaymentInProgress(programId: number): Promise<boolean> {
    // First check if payments are locked in the program entity
    const programPaymentsAreLocked =
      await this.arePaymentsLockedForProgram(programId);
    if (programPaymentsAreLocked) {
      return true;
    }

    // If no actions in progress, check if there are any payments in progress in the queue
    return await this.isPaymentInProgressForProgramQueue(programId);
  }

  private throwPaymentInProgressException(): void {
    throw new HttpException(
      { errors: 'Payment is already in progress' },
      HttpStatus.BAD_REQUEST,
    );
  }

  private async arePaymentsLockedForProgram(
    programId: number,
  ): Promise<boolean> {
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      select: { paymentsAreLocked: true },
    });
    return program.paymentsAreLocked;
  }

  private async isPaymentInProgressForProgramQueue(
    programId: number,
  ): Promise<boolean> {
    // If there is more that one program with the same FSP we can use the delayed count of a program which is faster else we need to do use the redis set
    const nrPending = await this.redisClient.scard(getRedisSetName(programId));
    const paymentIsInProgress = nrPending > 0;
    return paymentIsInProgress;
  }
}
