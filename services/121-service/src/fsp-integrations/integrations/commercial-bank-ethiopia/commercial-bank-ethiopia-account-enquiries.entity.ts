import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Entity('commercial_bank_ethiopia_account_enquiries')
export class CommercialBankEthiopiaAccountEnquiriesEntity extends Base121Entity {
  @OneToOne(() => RegistrationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int', nullable: false })
  public registrationId: number;

  @Column({ type: 'character varying', nullable: true })
  public fullNameUsedForTheMatch: string | null;

  @Column({ type: 'character varying', nullable: true })
  public bankAccountNumberUsedForCall: string | null;

  @Column({ type: 'character varying', nullable: true })
  public cbeName: string | null;

  @Column({ type: 'character varying', nullable: true })
  public cbeStatus: string | null;

  @Column({ type: 'character varying', nullable: true })
  public errorMessage: string | null;
}
