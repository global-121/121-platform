import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';

@Injectable()
export class PaymentsProgressHelperService {
  public constructor(
    private readonly actionService: ActionsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async checkPaymentInProgressAndThrow(
    programId: number,
  ): Promise<void> {
    if (await this.isPaymentInProgress(programId)) {
      throw new HttpException(
        { errors: 'Payment is already in progress' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async isPaymentInProgress(programId: number): Promise<boolean> {
    // TODO: REFACTOR: Remove this call, as we want to remove the Actions Module altogether.
    // Ruben: I would be careful with this refactor. The action table is update much earlies than the queue. So for a big payment it can take while for the queue to start. So if we remove the actions table we need something else..
    // check progress based on actions-table first
    // Check if there are any actions in progress
    const actionsInProgress =
      await this.checkPaymentActionInProgress(programId);
    if (actionsInProgress) {
      return true;
    }

    // If no actions in progress, check if there are any payments in progress in the queue
    return await this.isPaymentInProgressForProgramQueue(programId);
  }

  private async checkPaymentActionInProgress(
    programId: number,
  ): Promise<boolean> {
    const latestPaymentStartedAction = await this.actionService.getLatestAction(
      programId,
      AdditionalActionType.paymentStarted,
    );
    // TODO: REFACTOR: Use the Redis way of determining if a payment is in progress, see function this.checkFspQueueProgress
    // Ruben: I would be careful with this refactor. The action table is update much earlier in the payment api call than the queue. So for a big payment it can take while for the queue to start and a browser/person could potentially start the same payment twice
    // If never started, then not in progress, return early
    if (!latestPaymentStartedAction) {
      return false;
    }

    const latestPaymentFinishedAction =
      await this.actionService.getLatestAction(
        programId,
        AdditionalActionType.paymentFinished,
      );
    // If started, but never finished, then in progress
    if (!latestPaymentFinishedAction) {
      return true;
    }
    // If started and finished, then compare timestamps
    const startTimestamp = new Date(latestPaymentStartedAction?.created);
    const finishTimestamp = new Date(latestPaymentFinishedAction?.created);
    return finishTimestamp < startTimestamp;
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
