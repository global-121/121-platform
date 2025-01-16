import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';

@Entity('nedbank_voucher')
export class NedbankVoucherEntity extends Base121Entity {
  @Column({ unique: true })
  public orderCreateReference: string;

  @Column({ nullable: true, type: 'character varying' })
  public status: NedbankVoucherStatus;

  @Column({ type: 'integer', default: 0 })
  public retrivalCount: number;

  @OneToOne(() => TransactionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: false })
  public transactionId: number;
}
