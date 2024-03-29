import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Queue } from 'bull';
import {
  ProcessNameRegistration,
  QueueNameRegistration,
} from '../../../notifications/enum/queue.names.enum';
import { ScopedUserRequest } from '../../../shared/middleware/scope-user.middleware';
import { RegistrationsUpdateJobDto } from '../../dto/registration-update-job.dto';

@Injectable()
export class QueueRegistrationUpdateService {
  public constructor(
    @Inject(REQUEST) private request: ScopedUserRequest,
    @InjectQueue(QueueNameRegistration.registration)
    private readonly queueRegistrationUpdate: Queue,
  ) {}

  public async addRegistrationUpdateToQueue(
    job: RegistrationsUpdateJobDto,
  ): Promise<void> {
    job.request = { userId: this.request.userId, scope: this.request.scope };
    await this.queueRegistrationUpdate.add(ProcessNameRegistration.update, job);
  }
}
