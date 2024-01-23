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

export enum IntersolveVisaCardStatus {
  CardOk = 'CARD_OK',
  CardBlocked = 'CARD_BLOCKED',
  SuspectedFraud = 'SUSPECTED_FRAUD',
  CardClosedDueToFraud = 'CARD_CLOSED_DUE_TO_FRAUD',
  CardNoRenewal = 'CARD_NO_RENEWAL',
  CardStolen = 'CARD_STOLEN',
  CardLost = 'CARD_LOST',
  CardClosed = 'CARD_CLOSED',
  CardExpired = 'CARD_EXPIRED',
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
  public walletStatus: IntersolveVisaWalletStatus;

  @Column({ nullable: true })
  public cardStatus: IntersolveVisaCardStatus;

  @Column({ nullable: true })
  public lastUsedDate: Date;

  // Last time we got an update from Intersolve about the wallet status or balance or when it was last used
  @Column({ nullable: true })
  public lastExternalUpdate: Date;

  // This is euro cents
  @Column({ default: 0 })
  public spentThisMonth: number;

  @ManyToOne(
    () => IntersolveVisaCustomerEntity,
    (intersolveVisaCustomer) => intersolveVisaCustomer.visaWallets,
  )
  public intersolveVisaCustomer: IntersolveVisaCustomerEntity;

  public calculateTopUpAmount(): number {
    return (150 * 100 - this.spentThisMonth - this.balance) / 100;
  }
}
