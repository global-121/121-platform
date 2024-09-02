import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('safaricom_transfer')
export class SafaricomTransferEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public originatorConversationId: string;

  @Column()
  public mpesaConversationId: string;

  @OneToOne(() => TransactionEntity)
  @JoinColumn({ name: 'mpesaTransactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: true })
  public mpesaTransactionId: number | null;
}
