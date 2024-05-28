import { Base121Entity } from '@121-service/src/base.entity';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageProcessType } from '@121-service/src/notifications/message-job.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

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

  @Column({ type: 'character varying', nullable: true })
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

  @Column({ type: 'character varying', nullable: true })
  public processType: MessageProcessType | null;

  @Column({ type: 'character varying', nullable: true })
  public errorCode: string | null;

  @Column({ type: 'character varying', nullable: true })
  public errorMessage: string | null;

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
