// This entity does not store intersolve vouchers messages only 'normal' notifications

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { RegistrationEntity } from '../../registration/registration.entity';

@Entity('whatsapp_pending_message')
export class WhatsappPendingMessageEntity extends Base121Entity {
  @Column()
  public body: string;

  @Column({ nullable: true })
  public mediaUrl: string;

  @Column({ nullable: true })
  public messageType: string;

  @Column()
  public to: string;

  @Column({ type: 'int', nullable: true })
  public registrationId: number;

  @ManyToOne(
    _type => RegistrationEntity,
    registration => registration.whatsappPendingMessages,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
}
