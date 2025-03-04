import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';

@Entity('distinct_registration_pair')
@Unique(['smallerRegistrationId', 'largerRegistrationId'])
export class DistinctRegistrationPairEntity extends Base121Entity {
  @ManyToOne(
    (_type) => RegistrationEntity,

    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'smallerRegistrationId' })
  public registrationWithSmallerId: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public smallerRegistrationId: number;

  @ManyToOne(
    (_type) => RegistrationEntity,

    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'largerRegistrationId' })
  public registrationWithLargerId: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public largerRegistrationId: number;
}
