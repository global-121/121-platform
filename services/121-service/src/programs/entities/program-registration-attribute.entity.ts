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
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { NameConstraintQuestions } from '@121-service/src/shared/const';
import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
import { UILanguageTranslationPartial } from '@121-service/src/shared/types/ui-language-translation-partial.type';

@Unique('programAttributeUnique', ['name', 'programId'])
@Check(`"name" NOT IN (${NameConstraintQuestions})`)
@Entity('program_registration_attribute')
export class ProgramRegistrationAttributeEntity extends Base121Entity {
  @Column()
  public name: string;

  @Column('json')
  public label: UILanguageTranslationPartial;

  @Column({ type: 'character varying' })
  public type: RegistrationAttributeTypes;

  @Column()
  public isRequired: boolean;

  @Column('json', { nullable: true })
  public placeholder: UILanguageTranslationPartial | null;

  @Column('json', { nullable: true })
  public options: QuestionOption[] | null;

  @Column('json', { default: {} })
  public scoring: Record<string, unknown>;

  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programRegistrationAttributes,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

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
      registrationAttributeData.programRegistrationAttribute,
  )
  public registrationAttributeData: Relation<RegistrationAttributeDataEntity[]>;

  @Column({ default: false })
  public editableInPortal: boolean;
}
