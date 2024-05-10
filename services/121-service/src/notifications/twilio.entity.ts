import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Base121Entity } from '../base.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { MessageContentType } from './enum/message-type.enum';
import { MessageProcessType } from './message-job.dto';

export enum NotificationType {
  Sms = 'sms',
  Call = 'call',
  Whatsapp = 'whatsapp',
}

@Entity('twilio_message')
export class TwilioMessageEntity extends Base121Entity {
  @Column({ select: false })
  public accountSid: string;

  @Column()
  public body: string;

  @Column({ nullable: true })
  public mediaUrl: string | null;

  @Column()
  public to: string;

  @Column({ select: false })
  public from: string;

  @Column()
  @Index()
  public sid: string;

  @Column()
  @Index()
  public status: string;

  @Column()
  public type: NotificationType;

  @Column({ type: 'timestamp' })
  public dateCreated: Date;

  @Column({ default: MessageContentType.custom })
  public contentType: MessageContentType;

  @Column({ nullable: true })
  public processType: MessageProcessType | null;

  @Column({ nullable: true })
  public errorCode?: string | null;

  @Column({ nullable: true })
  public errorMessage?: string | null;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.twilioMessages,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Index()
  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @Column({ type: 'int', default: 0 })
  public retryCount: number;

  @OneToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transactionId' })
  public transaction: TransactionEntity;
  @Column({ type: 'int', nullable: true })
  public transactionId: number | null;
}
