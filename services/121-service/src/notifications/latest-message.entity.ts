import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { TwilioMessageEntity } from './twilio.entity';
import { Base121Entity } from '../base.entity';
import { RegistrationEntity } from '../registration/registration.entity';

@Entity('latest_message')
export class LatestMessageEntity extends Base121Entity {
  @OneToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.latestMessage,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Index()
  @Column({ type: 'int', nullable: true, unique: true })
  public registrationId: number;

  @OneToOne(() => TwilioMessageEntity)
  @JoinColumn({ name: 'messageId' })
  public message: TwilioMessageEntity;
  @Index()
  @Column({ type: 'int', nullable: true })
  public messageId: number;
}
