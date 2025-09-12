// This entity does not store intersolve vouchers messages only 'normal' notifications

import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Entity('try_whatsapp')
export class TryWhatsappEntity extends Base121Entity {
  @Column()
  public sid: string;

  @OneToOne((_type) => RegistrationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int', nullable: false })
  public registrationId: number;
}
