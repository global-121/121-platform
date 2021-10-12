import { RegistrationEntity } from './../registration/registration.entity';
import { Base121Entity } from './../base.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

export enum NotificationType {
  Sms = 'sms',
  Call = 'call',
  Whatsapp = 'whatsapp',
}

@Entity('twilio_message')
export class TwilioMessageEntity extends Base121Entity {
  @Column()
  public accountSid: string;

  @Column()
  public body: string;

  @Column({ nullable: true })
  public mediaUrl: string;

  @Column()
  public to: string;

  @Column()
  public from: string;

  @Column()
  public sid: string;

  @Column()
  public status: string;

  @Column()
  public type: NotificationType;

  @Column({ type: 'timestamp' })
  public dateCreated: Date;

  @Column({ type: 'int', nullable: true })
  public registrationId: number;

  @ManyToOne(
    _type => RegistrationEntity,
    registration => registration.twilioMessages,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
}
