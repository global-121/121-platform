import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';

@Entity('intersolve_visa_card')
export class IntersolveVisaCardEntity extends Base121Entity {
  @Column({ nullable: true })
  public success: boolean;

  @Index()
  @Column({ nullable: true })
  public tokenCode: string;

  @Column({ nullable: true })
  public tokenBlocked: boolean;

  @Column({ nullable: true })
  public expiresAt: string;

  @Column({ nullable: true })
  public status: string;

  @OneToOne(() => RegistrationEntity)
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column({ type: 'int', nullable: true })
  public registrationId: number;
}
