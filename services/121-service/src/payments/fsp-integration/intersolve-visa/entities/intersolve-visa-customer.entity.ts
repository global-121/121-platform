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

// TODO: Currently this is a duplicate entity, when the 'old' one is removed, this one should be fixed in the migration
@Entity('intersolve_visa_customer')
export class IntersolveVisaCustomerEntity extends CascadeDeleteEntity {
  @Index()
  @Column({ type: 'character varying' })
  public holderId: string;

  @OneToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int', nullable: true }) // TODO: Why is this nullable? An intersolve visa customer should always have a registration linked to it
  public registrationId: number | null;

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
