import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { LocalizedStringForUI } from '@121-service/src/shared/types/localized-string-for-ui.type';

@Unique('uniqueTemplatePerTypeLanguageProgram', [
  'type',
  'language',
  'programId',
])
// TODO: It may make sense to refactor this entity into 2 entities:
// One that stores templates with a message and one that stores templates with a content SID
@Entity('message_template')
export class MessageTemplateEntity extends Base121Entity {
  @Column()
  public type: string;

  @Column('json', { nullable: true })
  public label: LocalizedStringForUI | null;

  @Column()
  public language: string;

  @Column({ type: 'character varying', default: null, nullable: true })
  public message: string | null;

  @Column({ type: 'character varying', default: null, nullable: true })
  public contentSid: string | null;

  @Column({ default: false })
  public isSendMessageTemplate: boolean;

  @ManyToOne((_type) => ProgramEntity, (program) => program.messageTemplates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  public program?: Relation<ProgramEntity>;
  @Column()
  public programId: number;
}
