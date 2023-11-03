import { Column, Entity } from 'typeorm';
import { Base121Entity } from '../../base.entity';

@Entity('message_template')
export class MessageTemplateEntity extends Base121Entity {
  @Column()
  public programId: number;

  @Column()
  public type: string;

  @Column()
  public language: string;

  @Column()
  public message: string;

  @Column()
  public isWhatsappTemplate: boolean;
}
