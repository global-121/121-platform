import { Base121Entity } from '@121-service/src/base.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Column, Entity, Index, JoinColumn, OneToOne, Relation } from 'typeorm';

@Entity('latest_message')
export class LatestMessageEntity extends Base121Entity {
  @OneToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.latestMessage,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: true, unique: true })
  public registrationId: number | null;

  @OneToOne(() => TwilioMessageEntity)
  @JoinColumn({ name: 'messageId' })
  public message: Relation<TwilioMessageEntity>;
  @Index()
  @Column({ type: 'int', nullable: true })
  public messageId: number | null;
}
