import { Base121Entity } from './../base.entity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}
