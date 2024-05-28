import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import {
  BeforeRemove,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  Relation,
} from 'typeorm';

@Entity('intersolve_visa_customer')
export class IntersolveVisaCustomerEntity extends CascadeDeleteEntity {
  @Index()
  @Column({ type: 'character varying' })
  public holderId: string;

  @OneToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int' })
  public registrationId: number;

  @OneToOne(
    (_type) => IntersolveVisaParentWalletEntity,
    (intersolveVisaParentWallet) =>
      intersolveVisaParentWallet.intersolveVisaCustomer,
  )
  public intersolveVisaParentWallet: Relation<IntersolveVisaParentWalletEntity>;

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: IntersolveVisaParentWalletEntity,
        columnName: 'intersolveVisaCustomer',
      },
    ]);
  }
}
