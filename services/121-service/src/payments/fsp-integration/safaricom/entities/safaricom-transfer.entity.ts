import { Base121Entity } from '@121-service/src/base.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('safaricom_transfer')
export class SafaricomTransferEntity extends Base121Entity {
  @Column({ unique: true })
  public originatorConversationId: string;

  @Column({ nullable: true })
  public mpesaConversationId: string;

  @Column({ nullable: true })
  public mpesaTransactionId: string;

  @OneToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: false })
  public transactionId: number;
}
