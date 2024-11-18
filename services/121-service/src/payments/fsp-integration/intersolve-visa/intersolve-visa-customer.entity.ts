import {
  BeforeRemove,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  Relation,
} from 'typeorm';

import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { IntersolveVisaWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';

@Entity('intersolve_visa_customer')
export class IntersolveVisaCustomerEntity extends CascadeDeleteEntity {
  @Index()
  @Column({ type: 'character varying', nullable: true })
  public holderId: string | null;

  @OneToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @OneToMany(
    (_type) => IntersolveVisaWalletEntity,
    (visaWallets) => visaWallets.intersolveVisaCustomer,
  )
  public visaWallets: Relation<IntersolveVisaWalletEntity[]>;

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
