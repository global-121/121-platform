import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { SafaricomPaymentResult } from '@121-service/src/payments/fsp-integration/safaricom/dto/safaricom-load-response.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { WrapperType } from '@121-service/src/wrapper.type';

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
  public requestResult?: Record<string, unknown>;

  @Column('json', {
    default: {},
  })
  public paymentResult?: WrapperType<SafaricomPaymentResult>;

  @OneToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: true })
  public transactionId: number | null;
}
