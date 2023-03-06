import { Column, Entity, Index, OneToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { IntersolveVisaTokenStatus } from './enum/intersolve-visa-token-status.enum';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';

@Entity('intersolve_visa_card')
export class IntersolveVisaCardEntity extends Base121Entity {
  @Column({ nullable: true })
  public success: boolean;

  @Index()
  @Column({ unique: true, nullable: true })
  public tokenCode: string;

  @Column({ nullable: true })
  public tokenBlocked: boolean;

  @Column({ nullable: true })
  public expiresAt: string;

  @Column({ nullable: true })
  public status: IntersolveVisaTokenStatus;

  @OneToOne(
    () => IntersolveVisaCustomerEntity,
    (intersolveVisaCustomer) => intersolveVisaCustomer.visaCard,
  )
  public intersolveVisaCustomer: IntersolveVisaCustomerEntity;
}
