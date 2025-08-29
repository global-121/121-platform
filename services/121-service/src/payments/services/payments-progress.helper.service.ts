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
    projectId: number,
  ): Promise<void> {
    if (await this.isPaymentInProgress(projectId)) {
      throw new HttpException(
        { errors: 'Payment is already in progress' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async isPaymentInProgress(projectId: number): Promise<boolean> {
    // check progress based on actions-table first
    // Check if there are any actions in progress
    const actionsInProgress =
      await this.checkPaymentActionInProgress(projectId);
    if (actionsInProgress) {
      return true;
    }

    // If no actions in progress, check if there are any payments in progress in the queue
    return await this.isPaymentInProgressForProjectQueue(projectId);
  }

  private async checkPaymentActionInProgress(
    projectId: number,
  ): Promise<boolean> {
    const latestPaymentStartedAction = await this.actionService.getLatestAction(
      projectId,
      AdditionalActionType.paymentStarted,
    );
    // If never started, then not in progress, return early
    if (!latestPaymentStartedAction) {
      return false;
    }

    const latestPaymentFinishedAction =
      await this.actionService.getLatestAction(
        projectId,
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

  private async isPaymentInProgressForProjectQueue(
    projectId: number,
  ): Promise<boolean> {
    // If there is more that one project with the same FSP we can use the delayed count of a project which is faster else we need to do use the redis set
    const nrPending = await this.redisClient.scard(getRedisSetName(projectId));
    const paymentIsInProgress = nrPending > 0;
    return paymentIsInProgress;
  }
}
