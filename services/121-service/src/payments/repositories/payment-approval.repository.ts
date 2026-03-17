import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { PaymentApprovalEntity } from '@121-service/src/payments/entities/payment-approval.entity';

export class PaymentApprovalRepository extends Repository<PaymentApprovalEntity> {
  constructor(
    @InjectRepository(PaymentApprovalEntity)
    private baseRepository: Repository<PaymentApprovalEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getCurrentApprovalStep({
    paymentId,
  }: {
    paymentId: number;
  }): Promise<PaymentApprovalEntity | null> {
    return this.baseRepository.findOne({
      where: { paymentId: Equal(paymentId), approved: Equal(false) },
      order: { rank: 'ASC' },
      relations: { approverAssignments: { user: true } },
    });
  }
}
