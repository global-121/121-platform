import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal } from 'typeorm';

export class IntersolveVisaCustomerScopedRepository extends ScopedRepository<IntersolveVisaCustomerEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(IntersolveVisaCustomerEntity)
    scopedRepository: ScopedRepository<IntersolveVisaCustomerEntity>,
  ) {
    super(request, scopedRepository);
  }

  public async findOneWithWalletsByRegistrationId(registrationId: number) {
    return await this.findOne({
      relations: [
        'intersolveVisaParentWallet',
        'intersolveVisaParentWallet.intersolveVisaChildWallets',
      ],
      where: { registrationId: Equal(registrationId) },
    });
  }

  public async findWithWallets() {
    return await this.find({
      relations: [
        'intersolveVisaParentWallet',
        'intersolveVisaParentWallet.intersolveVisaChildWallets',
      ],
    });
  }
}
