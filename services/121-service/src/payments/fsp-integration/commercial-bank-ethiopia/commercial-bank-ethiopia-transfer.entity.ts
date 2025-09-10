import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';

@Entity('cbe_transfer')
export class CbeTransferEntity extends Base121Entity {
  @Column()
  public debitTheirRef: string; // There is no unique constraint here, as a retry transaction will have same debitTheirRef. This will change in 'transaction events' refactor.

  @OneToOne(() => TransactionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: false })
  public transactionId: number;
}
