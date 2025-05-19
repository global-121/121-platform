import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AirtelDisbursementEntity } from '@121-service/src/payments/fsp-integration/airtel/entities/airtel-disbursement.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class AirtelDisbursementScopedRepository extends ScopedRepository<AirtelDisbursementEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(AirtelDisbursementEntity)
    repository: Repository<AirtelDisbursementEntity>,
  ) {
    super(request, repository);
  }

  public async get({
    programId,
    registrationReferenceId,
    paymentNumber,
  }: {
    programId: number;
    registrationReferenceId: string;
    paymentNumber: number;
  }): Promise<AirtelDisbursementEntity | null> {
    const airtelDisbursement = await this.createQueryBuilder(
      'airtelDisbursement',
    )
      .leftJoin('airtelDisbursement.transaction', 'transaction')
      .leftJoin('transaction.registration', 'registration')
      .andWhere('registration.referenceId = :registrationReferenceId', {
        registrationReferenceId,
      })
      .andWhere('transaction.programId = :programId', { programId })
      .andWhere('transaction.payment = :paymentNumber', { paymentNumber })
      .getOne();

    // Can be null
    return airtelDisbursement;
  }
}
