import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('commercial_bank_ethiopia_account_enquiries')
export class CommercialBankEthiopiaAccountEnquiriesEntity extends Base121Entity {
  @OneToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @Column({ type: 'character varying', nullable: true })
  public fullNameUsedForTheMatch: string | null;

  @Column({ type: 'character varying', nullable: true })
  public bankAccountNumberUsedForCall: string | null;

  @Column({ type: 'character varying', nullable: true })
  public cbeName: string | null;

  @Column({ type: 'boolean', nullable: true })
  public namesMatch: boolean | null;

  @Column({ type: 'character varying', nullable: true })
  public cbeStatus: string | null;

  @Column({ type: 'character varying', nullable: true })
  public errorMessage: string | null;
}
