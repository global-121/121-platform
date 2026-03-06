import { MessageStatus } from 'twilio/lib/rest/api/v2010/account/message';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { MessageProcessType } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

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

  @Column({ type: 'varchar', nullable: true })
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
  @Column({ type: 'character varying' })
  public status: MessageStatus;

  @Column({ type: 'character varying' })
  public type: NotificationType;

  @Column({ type: 'timestamp' })
  public dateCreated: Date;

  @Column({ default: MessageContentType.custom, type: 'character varying' })
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
    { onDelete: 'CASCADE' }, // Delete instead of 'SET NULL' even though this is nullable
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: true }) // Keep this FK nullable, as e.g. for default reply there is no registrationId
  public registrationId: number | null;

  @Column({ type: 'int', default: 0 })
  public retryCount: number;

  @ManyToOne(() => TransactionEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'transactionId' })
  public transaction: Relation<TransactionEntity>;
  @Column({ type: 'int', nullable: true })
  public transactionId: number | null;

  @ManyToOne(() => UserEntity, {
    onDelete: 'NO ACTION', // Do not delete on deleting users, instead see catch in userService.delete()
  })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;
  @Column({ type: 'int', nullable: true })
  public userId: number | null; // UserId can be null for system generated messages (e.g. a messsage send on new kobo submission )
}
