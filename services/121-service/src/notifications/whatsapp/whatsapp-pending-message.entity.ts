// This entity does not store intersolve vouchers messages only 'normal' notifications

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { MessageContentType } from '../enum/message-type.enum';

@Entity('whatsapp_pending_message')
export class WhatsappPendingMessageEntity extends Base121Entity {
  @Column()
  public body: string;

  @Column({ nullable: true })
  public mediaUrl: string | null;

  @Column({ nullable: true })
  public messageType: string | null;

  @Column()
  public to: string;

  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @Column({ default: MessageContentType.custom })
  public contentType: MessageContentType;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.whatsappPendingMessages,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
}
