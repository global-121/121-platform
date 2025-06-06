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
    scopedRepository: Repository<AirtelDisbursementEntity>,
  ) {
    super(request, scopedRepository);
  }

  public async storeDisbursement({
    airtelTransactionId,
    airtelStatusResponseCode,
    isResponseReceived,
    transactionId,
  }: {
    airtelTransactionId: string;
    airtelStatusResponseCode: string;
    isResponseReceived: boolean;
    transactionId: number;
  }): Promise<void> {
    const disbursement = this.create({
      airtelTransactionId,
      airtelStatusResponseCode,
      isResponseReceived,
      transactionId,
    });
    await this.save(disbursement);
  }

  public async updateDisbursement({
    _idempotencyKey,
    _airtelStatusResponseCode,
    _isResponseReceived,
  }: {
    _idempotencyKey: string;
    _airtelStatusResponseCode: string;
    _isResponseReceived: boolean;
  }): Promise<void> {
    console.log('updateDisbursement');
  }

  public async getDisbursement({
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

  public async deleteDisbursement({
    programId,
    registrationReferenceId,
    paymentNumber,
  }: {
    programId: number;
    registrationReferenceId: string;
    paymentNumber: number;
  }): Promise<void> {
    // delete the airtel disbursement
    await this.createQueryBuilder('airtelDisbursement')
      .leftJoin('airtelDisbursement.transaction', 'transaction')
      .leftJoin('transaction.registration', 'registration')
      .andWhere('registration.referenceId = :registrationReferenceId', {
        registrationReferenceId,
      })
      .andWhere('transaction.programId = :programId', { programId })
      .andWhere('transaction.payment = :paymentNumber', { paymentNumber })
      .delete()
      .execute();
  }
}
