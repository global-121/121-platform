// This entity does not store intersolve vouchers messages only 'normal' notifications

import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { RegistrationEntity } from '../../registration/registration.entity';

@Entity('try_whatsapp')
export class TryWhatsappEntity extends Base121Entity {
  @Column()
  public sid: string;

  @OneToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.whatsappPendingMessages,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;
}
