import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';

export enum IntersolveVisaWalletStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Redeemed = 'REDEEMED',
  Substituted = 'SUBSTITUTED',
  Expired = 'EXPIRED',
  Disabled = 'DISABLED',
}
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

  @Column({ nullable: true })
  public balance: number;

  @Column({ nullable: true })
  public status: IntersolveVisaWalletStatus;

  @Column({ nullable: true })
  public lastUsedDate: Date;

  @Column({ nullable: true })
  public activatedDate: Date;

  @ManyToOne(
    () => IntersolveVisaCustomerEntity,
    (intersolveVisaCustomer) => intersolveVisaCustomer.visaWallets,
  )
  public intersolveVisaCustomer: IntersolveVisaCustomerEntity;
}
