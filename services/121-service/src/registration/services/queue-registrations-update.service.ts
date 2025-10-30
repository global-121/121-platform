import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { ProcessNameRegistration } from '@121-service/src/registration/enum/process-name-registration.enum';
import { RegistrationsUpdateJobDto } from '@121-service/src/registrations-update-jobs/dto/registrations-update-job.dto';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

@Injectable()
export class QueueRegistrationUpdateService {
  public constructor(
    @Inject(REQUEST) private request: ScopedUserRequest,
    private readonly queuesService: QueuesRegistryService,
  ) {}

  public async addRegistrationsUpdateToQueue(
    job: Omit<RegistrationsUpdateJobDto, 'request'>,
  ): Promise<void> {
    // UsedId has to be defined, else there would have been an auth error
    if (!this.request.user || !this.request.user.id) {
      throw new Error(
        'User information is missing when processing registration update',
      );
    }

    await this.queuesService.updateRegistrationQueue.add(
      ProcessNameRegistration.update,
      {
        ...job,
        request: {
          userId: this.request.user.id,
          scope: this.request.user.scope,
        },
      },
    );
  }
}
