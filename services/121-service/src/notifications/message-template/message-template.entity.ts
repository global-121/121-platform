import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProjectEntity } from '@121-service/src/programs/project.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Unique('uniqueTemplatePerTypeLanguageProject', [
  'type',
  'language',
  'projectId',
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

  @ManyToOne((_type) => ProjectEntity, (project) => project.messageTemplates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  public project?: Relation<ProjectEntity>;
  @Column()
  public projectId: number;
}
