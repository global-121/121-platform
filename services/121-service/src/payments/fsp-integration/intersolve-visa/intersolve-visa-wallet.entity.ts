import { Column, Entity, Index, OneToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';

@Entity('intersolve_visa_wallet')
export class IntersolveVisaWalletEntity extends Base121Entity {
  @Index()
  @Column({ unique: true, nullable: true })
  public tokenCode: string;

  @Column({ nullable: true })
  public tokenBlocked: boolean;

  @Column({ default: false })
  public linkedToVisaCustomer: boolean;

  @Column({ default: false })
  public debitCardCreated: boolean;

  @OneToOne(
    () => IntersolveVisaCustomerEntity,
    (intersolveVisaCustomer) => intersolveVisaCustomer.visaWallet,
  )
  public intersolveVisaCustomer: IntersolveVisaCustomerEntity;
}
