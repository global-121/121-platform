// This entity does not store intersolve vouchers messages only 'normal' notifications

import { Base121Entity } from '@121-service/src/base.entity';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

@Entity('whatsapp_pending_message')
export class WhatsappPendingMessageEntity extends Base121Entity {
  @Column()
  public body: string;

  @Column({ type: 'character varying', nullable: true })
  public mediaUrl: string | null;

  @Column({ type: 'character varying', nullable: true })
  public messageType: string | null;

  @Column()
  public to: string;

  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @Column({ default: MessageContentType.custom, type: 'varchar' })
  public contentType: MessageContentType;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.whatsappPendingMessages,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
}
