import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { ProgramEntity } from '../../programs/program.entity';

@Unique('uniqueTemplatePerTypeLanguageProgram', [
  'type',
  'language',
  'programId',
])
@Entity('message_template')
export class MessageTemplateEntity extends Base121Entity {
  @Column()
  public type: string;

  @Column()
  public language: string;

  @Column()
  public message: string;

  @Column()
  public isWhatsappTemplate: boolean;

  @ManyToOne((_type) => ProgramEntity, (program) => program.messageTemplates)
  @JoinColumn({ name: 'programId' })
  public program?: ProgramEntity;
  @Column()
  public programId: number;
}
