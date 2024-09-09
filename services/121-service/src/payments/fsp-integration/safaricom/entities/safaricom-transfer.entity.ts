import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';

@Entity('safaricom_transfer')
export class SafaricomTransferEntity extends Base121Entity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public originatorConversationId: string;

  @Column()
  public mpesaConversationId: string;

  @Column({ nullable: true })
  public mpesaTransactionId: string;

  @OneToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: true })
  public transactionId: number | null;
}
