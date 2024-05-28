// This entity does not store intersolve vouchers messages only 'normal' notifications

import { Base121Entity } from '@121-service/src/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('whatsapp_template_test')
export class WhatsappTemplateTestEntity extends Base121Entity {
  @Column()
  public sid: string;

  @Column()
  public programId: number;

  @Column()
  public language: string;

  @Column()
  public messageKey: string;

  @Column({ type: 'boolean', nullable: true })
  public succes: boolean | null;

  @Column({ type: 'character varying', nullable: true })
  public callback: string | null;

  @Index()
  @Column()
  public sessionId: string;
}
