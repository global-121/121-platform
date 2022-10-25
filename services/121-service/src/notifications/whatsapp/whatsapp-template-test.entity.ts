// This entity does not store intersolve vouchers messages only 'normal' notifications

import { Column, Entity, Index } from 'typeorm';
import { Base121Entity } from '../../base.entity';

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

  @Column({ nullable: true })
  public succes: boolean;

  @Column({ nullable: true })
  public callback: string;

  @Index()
  @Column()
  public sessionId: string;
}
