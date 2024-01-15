import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionEntity } from '../../../payments/transactions/transaction.entity';

@Entity('safaricom_request')
export class SafaricomRequestEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public initiatorName: string;

  @Column()
  public securityCredential: string;

  @Column()
  public commandID: string;

  @Column()
  public amount: number;

  @Column()
  public partyA: string;

  @Column()
  public partyB: string;

  @Column()
  public remarks: string;

  @Column()
  public queueTimeOutURL: string;

  @Column()
  public resultURL: string;

  @Column()
  public occassion: string;

  @Column()
  public status: string;

  @Column()
  public originatorConversationID: string;

  @Column()
  public conversationID: string;

  @Column('json', {
    default: {},
  })
  public requestResult?: JSON;

  @Column('json', {
    default: {},
  })
  public paymentResult?: JSON;

  @OneToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: true })
  public transactionId: number;
}
