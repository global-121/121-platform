import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';

// TODO: REFACTOR: Consider splitting this entity into two separate entities NedbankOrderEntity and NedbankVoucherEntity
@Entity('nedbank_voucher')
export class NedbankVoucherEntity extends Base121Entity {
  @Index()
  @Column({ unique: true })
  public orderCreateReference: string;

  @Column({ nullable: true, type: 'character varying' })
  public status: NedbankVoucherStatus | undefined;

  @Column({ type: 'character varying' })
  public paymentReference: string;

  @OneToOne(() => TransactionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: false })
  public transactionId: number;
}
