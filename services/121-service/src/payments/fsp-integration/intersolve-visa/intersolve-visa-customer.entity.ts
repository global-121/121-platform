import {
  BeforeRemove,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CascadeDeleteEntity } from '../../../base.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { IntersolveVisaWalletEntity } from './intersolve-visa-wallet.entity';

@Entity('intersolve_visa_customer')
export class IntersolveVisaCustomerEntity extends CascadeDeleteEntity {
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

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: IntersolveVisaWalletEntity,
        columnName: 'intersolveVisaCustomer',
      },
    ]);
  }
}
