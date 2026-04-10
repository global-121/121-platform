import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntersolveVisaWalletClosureEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-wallet-closure.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class IntersolveVisaWalletClosureScopedRepository extends ScopedRepository<IntersolveVisaWalletClosureEntity> {
  public constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(IntersolveVisaWalletClosureEntity)
    repository: Repository<IntersolveVisaWalletClosureEntity>,
  ) {
    super(request, repository);
  }

  public async getForExport(programId: number): Promise<
    {
      referenceId: string;
      cardNumber: string;
      closedDate: Date;
      amountBookedBackInCents: number;
    }[]
  > {
    return this.createQueryBuilder('closure')
      .innerJoin('closure.intersolveVisaChildWallet', 'childWallet')
      .innerJoin('childWallet.intersolveVisaParentWallet', 'parentWallet')
      .innerJoin('parentWallet.intersolveVisaCustomer', 'customer')
      .innerJoin('customer.registration', 'registration')
      .select([
        `registration."referenceId" as "referenceId"`,
        `"childWallet"."tokenCode" as "cardNumber"`,
        `"closure"."created" as "closedDate"`,
        `"closure"."amountBookedBackInCents" as "amountBookedBackInCents"`,
      ])
      .andWhere('registration."programId" = :programId', { programId })
      .orderBy('"closure"."created"', 'DESC')
      .getRawMany();
  }
}
