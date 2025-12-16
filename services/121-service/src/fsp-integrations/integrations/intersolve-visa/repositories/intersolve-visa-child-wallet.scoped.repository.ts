import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntersolveVisaChildWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class IntersolveVisaChildWalletScopedRepository extends ScopedRepository<IntersolveVisaChildWalletEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(IntersolveVisaChildWalletEntity)
    repository: Repository<IntersolveVisaChildWalletEntity>,
  ) {
    super(request, repository);
  }

  async hasLinkedChildWalletForRegistrationId(
    registrationId: number,
  ): Promise<boolean> {
    const child = await this.createQueryBuilder('child')
      .leftJoin('child.intersolveVisaParentWallet', 'parent')
      .leftJoin('parent.intersolveVisaCustomer', 'customer')
      .leftJoin('customer.registration', 'registration')
      .andWhere('registration.id = :registrationId', { registrationId })
      .andWhere('child.isLinkedToParentWallet = :linked', { linked: true })
      .select('child.id')
      .limit(1)
      .getRawOne();

    return !!child;
  }
}
