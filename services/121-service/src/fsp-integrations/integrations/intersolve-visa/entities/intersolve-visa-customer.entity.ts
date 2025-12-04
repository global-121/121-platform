import { Column, Entity, Index, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Entity('intersolve_visa_customer')
export class IntersolveVisaCustomerEntity extends Base121Entity {
  @Index()
  @Column({ type: 'character varying' })
  public holderId: string;

  @OneToOne(() => RegistrationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int' })
  public registrationId: number;

  @OneToOne(
    (_type) => IntersolveVisaParentWalletEntity,
    (intersolveVisaParentWallet) =>
      intersolveVisaParentWallet.intersolveVisaCustomer,
    { onDelete: 'NO ACTION' },
  )
  public intersolveVisaParentWallet?: Relation<IntersolveVisaParentWalletEntity>;
}
