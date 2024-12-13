import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { QueuesService } from '@121-service/src/queues/queues.service';
import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { ProcessNameRegistration } from '@121-service/src/registration/enum/process-name-registration.enum';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

@Injectable()
export class QueueRegistrationUpdateService {
  public constructor(
    @Inject(REQUEST) private request: ScopedUserRequest,
    private readonly queuesService: QueuesService,
  ) {}

  public async addRegistrationUpdateToQueue(
    job: RegistrationsUpdateJobDto,
  ): Promise<void> {
    // UsedId has to be defined, else there would have been an auth error
    if (!this.request.user || !this.request.user.id) {
      throw new Error(
        'User information is missing when processing registration update',
      );
    }

    job.request = {
      userId: this.request.user.id,
      scope: this.request.user.scope,
    };
    await this.queuesService.updateRegistrationQueue.add(
      ProcessNameRegistration.update,
      job,
    );
  }
}
