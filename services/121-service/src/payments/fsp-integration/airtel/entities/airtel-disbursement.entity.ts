import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';

@Entity('airtel_disbursement')
export class AirtelDisbursementEntity extends Base121Entity {
  @Column({ unique: true })
  // The idempotency key for the disbursement.
  public airtelTransactionId: string;

  @Column({ nullable: true })
  public airtelStatusResponseCode: string;

  @Column({ nullable: true })
  public isResponseReceived: boolean;

  @OneToOne(() => TransactionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: false })
  public transactionId: number;
}
