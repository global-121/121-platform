import { Column, Entity, Index, JoinColumn, Relation, Unique } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';

// TODO needs unique constraint on the combination of registrationSmallerId and registrationLargerId

@Entity('registration_unique_pairs')
@Unique(['registrationSmallerId', 'registrationLargerId'])
export class RegistrationUniquePairEntity extends Base121Entity {
  @JoinColumn({ name: 'registrationSmallerId' })
  public registrationWithSmallerId: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public registrationSmallerId: number;

  @JoinColumn({ name: 'registrationLargerId' })
  public registrationWithLargerId: Relation<RegistrationEntity>;
  @Index()
  @Column({ type: 'int', nullable: false })
  public registrationLargerId: number;
}
