import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Entity('airtel_user_lookup')
export class AirtelUserLookupEntity extends Base121Entity {
  @OneToOne(() => RegistrationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int', nullable: false })
  public registrationId: number;

  @Column({ type: 'character varying', nullable: true })
  public phoneNumberUsedForCall: string | null;

  @Column({ type: 'character varying', nullable: true })
  public nameUsedForTheMatch: string | null;

  @Column({ type: 'boolean', nullable: true })
  public isAirtelUser: boolean | null;

  @Column({ type: 'character varying', nullable: true })
  public airtelName: string | null;

  @Column({ type: 'character varying', nullable: true })
  public errorMessage: string | null;
}
