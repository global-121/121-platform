import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Equal, Repository } from 'typeorm';

import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { ProgramPaymentLockEntity } from '@121-service/src/programs/program-payment-locks/program-payment-lock.entity';
import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';

@Injectable()
export class ProgramPaymentsLocksService {
  @InjectRepository(ProgramPaymentLockEntity)
  private readonly programPaymentLocksRepository: Repository<ProgramPaymentLockEntity>;
  public constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async unlockPaymentsForProgram(programId: number): Promise<void> {
    await this.programPaymentLocksRepository.delete({ programId });
  }

  public async checkAndLockPaymentProgressOrThrow({
    programId,
  }: {
    programId: number;
  }): Promise<void> {
    // Atomic lock: insert will succeed only if no lock exists (unique constraint on programId).
    // If another process inserts at the same time, Postgres guarantees only one succeeds.
    await this.checkPaymentInProgressAndThrow(programId);
    try {
      await this.programPaymentLocksRepository.insert({ programId });
    } catch (err) {
      if (err?.code === PostgresStatusCodes.UNIQUE_VIOLATION) {
        this.throwPaymentInProgressException();
      }
      throw err;
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
    // Check if a lock entity exists for this program
    const lock = await this.programPaymentLocksRepository.findOne({
      where: { programId: Equal(programId) },
    });
    if (lock) {
      return true;
    }
    // Optionally: check Redis queue for in-progress payments (if needed)
    return await this.isPaymentInProgressForProgramQueue(programId);
  }

  private throwPaymentInProgressException(): void {
    throw new HttpException(
      { errors: 'Payment is already in progress' },
      HttpStatus.BAD_REQUEST,
    );
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
