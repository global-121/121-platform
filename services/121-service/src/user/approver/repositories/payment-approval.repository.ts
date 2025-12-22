import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentApprovalEntity } from '@121-service/src/user/approver/entities/payment-approval.entity';

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
}
