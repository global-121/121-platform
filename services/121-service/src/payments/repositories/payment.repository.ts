import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';

export class PaymentRepository extends Repository<PaymentEntity> {
  constructor(
    @InjectRepository(PaymentEntity)
    private baseRepository: Repository<PaymentEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getPaymentsAndApprovalState({
    programId,
    paymentId,
  }: {
    programId: number;
    paymentId?: number;
  }): Promise<
    {
      id: number;
      created: Date;
      isPaymentApproved: boolean;
      approvalsRequired: number;
      approvalsGiven: number;
    }[]
  > {
    const query = this.createQueryBuilder('payment')
      .select('payment.id', 'id')
      .addSelect('payment.created', 'created')
      .leftJoin('payment.approvals', 'pa')
      .addSelect(
        'COALESCE(COUNT(*) FILTER (WHERE pa.approved = false), 0) = 0',
        'isPaymentApproved',
      )
      .addSelect('COALESCE(COUNT(pa.id), 0)', 'approvalsRequired')
      .addSelect(
        'COALESCE(COUNT(*) FILTER (WHERE pa.approved = true), 0)',
        'approvalsGiven',
      )
      .where('payment.programId = :programId', { programId })
      .groupBy('payment.id')
      .addGroupBy('payment.created')
      .orderBy('payment.id', 'DESC');

    if (paymentId !== undefined && paymentId !== null) {
      query.andWhere('payment.id = :paymentId', { paymentId });
    }

    const results = await query.getRawMany<{
      id: number;
      created: Date;
      isPaymentApproved: boolean;
      approvalsRequired: string;
      approvalsGiven: string;
    }>();

    // Convert string counts to numbers (getRawMany returns COUNT as strings)
    return results.map((result) => ({
      id: result.id,
      created: result.created,
      isPaymentApproved: result.isPaymentApproved,
      approvalsRequired: Number(result.approvalsRequired),
      approvalsGiven: Number(result.approvalsGiven),
    }));
  }
}
