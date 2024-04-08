import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Queue } from 'bull';
import {
  ProcessNameRegistration,
  QueueNameRegistration,
} from '../../../notifications/enum/queue.names.enum';
import { RegistrationsUpdateJobDto } from '../../dto/registration-update-job.dto';
import { ScopedUserRequest } from '../../../shared/scoped-user-request';

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
    job.request = { userId: this.request.user.id, scope: this.request.user.scope };
    await this.queueRegistrationUpdate.add(ProcessNameRegistration.update, job);
  }
}
