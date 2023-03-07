import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { IntersolveVisaWalletEntity } from './intersolve-visa-card.entity';

@Entity('intersolve_visa_customer')
export class IntersolveVisaCustomerEntity extends Base121Entity {
  @Column({ nullable: true })
  public blocked: boolean;

  @Index()
  @Column({ nullable: true })
  public holderId: string;

  @OneToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column({ type: 'int', nullable: true })
  public registrationId: number;

  @OneToOne(() => IntersolveVisaWalletEntity)
  @JoinColumn({ name: 'visaCardId' })
  public visaCard: IntersolveVisaWalletEntity;
  @Column({ type: 'int', nullable: true })
  public visaCardId: number;
}
