import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal } from 'typeorm';

import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { UserEntity } from '@121-service/src/user/user.entity';

export class TwilioMessageScopedRepository extends ScopedRepository<TwilioMessageEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(TwilioMessageEntity)
    scopedRepository: ScopedRepository<TwilioMessageEntity>,
  ) {
    super(request, scopedRepository);
  }

  // TODO: refactor to use this method in registrations service
  async getByReferenceId(referenceId: string) {
    const messageHistoryArray = await this.createQueryBuilder('registration')
      .select([
        'twilioMessage.dateCreated as created',
        'twilioMessage.from as from',
        'twilioMessage.to as to',
        'twilioMessage.body as body',
        'twilioMessage.status as status',
        'twilioMessage.type as type',
        'twilioMessage.mediaUrl as "mediaUrl"',
        'twilioMessage.contentType as "contentType"',
        'twilioMessage.errorCode as "errorCode"',
        'user.id as "userId"',
        'user.username as "username"',
      ])
      .leftJoin('registration.twilioMessages', 'twilioMessage')
      .leftJoin('twilioMessage.user', 'user')
      .andWhere('registration.referenceId = :referenceId', {
        referenceId,
      })
      .orderBy('twilioMessage.dateCreated', 'DESC')
      .getRawMany();

    if (
      messageHistoryArray.length === 1 &&
      messageHistoryArray[0].created === null
    ) {
      return [];
    }

    const result = messageHistoryArray.map((row) => {
      const { userId, username, ...rest } = row;
      return {
        ...rest,
        user: {
          id: userId,
          username,
        },
      };
    });

    return result;
  }

  async getManyByRegistrationId(registrationId: number) {
    const result: (TwilioMessageEntity & { user: UserEntity })[] =
      await this.find({
        where: {
          registration: { id: Equal(registrationId) },
        },
        relations: ['user'],
        order: { dateCreated: 'DESC' },
      });

    if (result.length === 1 && result[0].created === null) {
      return [];
    }

    return result;
  }
}
