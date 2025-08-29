import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { NameConstraintQuestions } from '@121-service/src/shared/const';
import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Unique('projectAttributeUnique', ['name', 'projectId'])
@Check(`"name" NOT IN (${NameConstraintQuestions})`)
@Entity('project_registration_attribute')
export class ProjectRegistrationAttributeEntity extends Base121Entity {
  @Column()
  public name: string;

  @Column('json')
  public label: LocalizedString;

  @Column({ type: 'character varying' })
  public type: RegistrationAttributeTypes;

  @Column()
  public isRequired: boolean;

  @Column('json', { nullable: true })
  public placeholder: LocalizedString | null;

  @Column('json', { nullable: true })
  public options: QuestionOption[] | null;

  @Column('json', { default: {} })
  public scoring: Record<string, unknown>;

  @ManyToOne(
    (_type) => ProjectEntity,
    (project) => project.projectRegistrationAttributes,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'projectId' })
  public project: Relation<ProjectEntity>;
  @Column()
  public projectId: number;

  @Column({ default: false })
  public includeInTransactionExport: boolean;

  @Column({ type: 'character varying', nullable: true })
  public pattern: string | null;

  @Column({ default: false })
  public duplicateCheck: boolean;

  @Column({ default: false })
  public showInPeopleAffectedTable: boolean;

  @OneToMany(
    () => RegistrationAttributeDataEntity,
    (registrationAttributeData) =>
      registrationAttributeData.projectRegistrationAttribute,
  )
  public registrationAttributeData: Relation<RegistrationAttributeDataEntity[]>;

  @Column({ default: false })
  public editableInPortal: boolean;
}
