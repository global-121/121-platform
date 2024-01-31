import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';

@Entity('commercial_bank_ethiopia_account_enquiries')
export class CommercialBankEthiopiaAccountEnquiriesEntity extends Base121Entity {
  @OneToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column({ type: 'int', nullable: true })
  public registrationId: number;

  @Column({ nullable: true })
  public fullNameUsedForTheMatch: string;

  @Column({ nullable: true })
  public bankAccountNumberUsedForCall: string;

  @Column({ nullable: true })
  public cbeName: string;

  @Column({ nullable: true })
  public namesMatch: boolean;

  @Column({ nullable: true })
  public cbeStatus: string;

  @Column({ nullable: true })
  public errorMessage: string;
}
