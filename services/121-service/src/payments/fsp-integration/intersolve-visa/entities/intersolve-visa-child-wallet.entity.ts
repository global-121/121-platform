import { Base121Entity } from '@121-service/src/base.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { Column, Entity, Index, ManyToOne, Relation } from 'typeorm';

@Entity('intersolve_visa_child_wallet')
export class IntersolveVisaChildWalletEntity extends Base121Entity {
  @ManyToOne(
    () => IntersolveVisaParentWalletEntity,
    (intersolveVisaParentWallet) =>
      intersolveVisaParentWallet.intersolveVisaChildWallets,
  )
  public intersolveVisaParentWallet: Relation<IntersolveVisaParentWalletEntity>;
  @Index()
  @Column()
  public intersolveVisaParentWalletId: number;

  @Index()
  @Column({ unique: true })
  public tokenCode: string;

  @Column({ default: false })
  public isLinkedToParentWallet: boolean;

  @Column({ default: false })
  public isTokenBlocked: boolean;

  @Column({ default: false })
  public isDebitCardCreated: boolean;

  @Column({ type: 'character varying' })
  public walletStatus: IntersolveVisaTokenStatus;

  @Column({ type: 'character varying', nullable: true })
  public cardStatus: IntersolveVisaCardStatus | null;

  @Column({ type: 'timestamp', nullable: true })
  public lastUsedDate: Date | null;

  // Last time we got an update from Intersolve about the wallet status or when it was last used
  @Column({ type: 'timestamp', nullable: true })
  public lastExternalUpdate: Date | null;
}
