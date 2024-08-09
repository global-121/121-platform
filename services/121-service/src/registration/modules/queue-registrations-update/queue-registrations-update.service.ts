import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import {
  ProcessNameRegistration,
  QueueNameRegistration,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Queue } from 'bull';

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
    job.request = {
      userId: this.request.user?.id,
      scope: this.request.user?.scope,
    };
    await this.queueRegistrationUpdate.add(ProcessNameRegistration.update, job);
  }
}
