import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Base121Entity } from './../base.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { MessageContentType } from './message-type.enum';

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
  public mediaUrl: string;

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

  @Column({ type: 'int', nullable: true })
  public registrationId: number;

  @Column({ default: MessageContentType.custom })
  public contentType: MessageContentType;

  @Column({ nullable: true })
  public errorCode?: string;

  @Column({ nullable: true })
  public errorMessage?: string;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.twilioMessages,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;

  @Column({ type: 'int', default: 0 })
  public retryCount: number;
}
