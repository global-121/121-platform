import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { LocalizedString } from 'src/shared/enum/language.enums';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Unique('uniqueTemplatePerTypeLanguageProgram', [
  'type',
  'language',
  'programId',
])
@Entity('message_template')
export class MessageTemplateEntity extends Base121Entity {
  @Column()
  public type: string;

  @Column('json', { nullable: true })
  public label: LocalizedString | null;

  @Column()
  public language: string;

  @Column()
  public message: string;

  @Column()
  public isWhatsappTemplate: boolean;

  @Column({ default: false })
  public isSendMessageTemplate: boolean;

  @ManyToOne((_type) => ProgramEntity, (program) => program.messageTemplates)
  @JoinColumn({ name: 'programId' })
  public program?: ProgramEntity;
  @Column()
  public programId: number;
}
