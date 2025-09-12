import { Column, Entity, Index, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Entity('latest_message')
export class LatestMessageEntity extends Base121Entity {
  @OneToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.latestMessage,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: true, unique: true }) // Nullable because there are messages without a registration. Refactor: as these would not need a record in this latest-message.entity
  public registrationId: number | null;

  @OneToOne(() => TwilioMessageEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  public message: Relation<TwilioMessageEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public messageId: number;
}
