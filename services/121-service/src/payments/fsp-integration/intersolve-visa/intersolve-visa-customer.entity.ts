import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { IntersolveVisaWalletEntity } from './intersolve-visa-wallet.entity';

@Entity('intersolve_visa_customer')
export class IntersolveVisaCustomerEntity extends Base121Entity {
  @Index()
  @Column({ nullable: true })
  public holderId: string;

  @OneToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column({ type: 'int', nullable: true })
  public registrationId: number;

  @OneToMany(
    (_type) => IntersolveVisaWalletEntity,
    (visaWallets) => visaWallets.intersolveVisaCustomer,
  )
  public visaWallets: IntersolveVisaWalletEntity[];
}
