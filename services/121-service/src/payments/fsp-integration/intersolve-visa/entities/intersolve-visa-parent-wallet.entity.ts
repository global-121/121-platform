import { Base121Entity } from '@121-service/src/base.entity';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

// TODO: Should this Entity extend from CascadeDeleteEntity instead? When should an Entity extend from it?
@Entity('intersolve_visa_parent_wallet')
export class IntersolveVisaParentWalletEntity extends Base121Entity {
  @OneToOne(() => IntersolveVisaCustomerEntity)
  @JoinColumn({ name: 'intersolveVisaCustomerId' })
  public intersolveVisaCustomer: IntersolveVisaCustomerEntity;
  @Column({ type: 'int' })
  public intersolveVisaCustomerId: number;

  @OneToMany(
    (_type) => IntersolveVisaChildWalletEntity,
    (intersolveVisaChildWallets) =>
      intersolveVisaChildWallets.intersolveVisaParentWallet,
  )
  public intersolveVisaChildWallets: IntersolveVisaChildWalletEntity[];

  @Index()
  @Column({ unique: true })
  public tokenCode: string;

  @Column({ default: false })
  public isLinkedToVisaCustomer: boolean;

  @Column({ default: 0 })
  public balance: number;

  // Last time we got an update from Intersolve about the wallet status or balance or when it was last used
  @Column()
  public lastExternalUpdate: Date;

  // This is euro cents
  @Column({ default: 0 })
  public spentThisMonth: number;
}
