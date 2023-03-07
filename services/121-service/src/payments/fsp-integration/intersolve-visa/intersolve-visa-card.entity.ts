import { Column, Entity, Index, OneToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { IntersolveVisaWalletStatus } from './enum/intersolve-visa-token-status.enum';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';

@Entity('intersolve_visa_wallet')
export class IntersolveVisaWalletEntity extends Base121Entity {
  @Index()
  @Column({ unique: true, nullable: true })
  public tokenCode: string;

  @Column({ nullable: true })
  public type: string;

  @Column({ nullable: true })
  public tokenBlocked: boolean;

  @Column({ nullable: true })
  public expiresAt: string;

  @Column({ nullable: true })
  public status: IntersolveVisaWalletStatus;

  @OneToOne(
    () => IntersolveVisaCustomerEntity,
    (intersolveVisaCustomer) => intersolveVisaCustomer.visaCard,
  )
  public intersolveVisaCustomer: IntersolveVisaCustomerEntity;
}
