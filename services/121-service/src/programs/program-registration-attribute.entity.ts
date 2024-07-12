import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { NameConstraintQuestions } from '@121-service/src/shared/const';
import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { ApiProperty } from '@nestjs/swagger';
import {
  BeforeRemove,
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';

@Unique('programAttributeUnique', ['name', 'programId'])
@Check(`"name" NOT IN (${NameConstraintQuestions})`)
@Entity('program_registration_attribute')
export class ProgramRegistrationAttributeEntity extends CascadeDeleteEntity {
  @Column()
  @ApiProperty({ example: 'question1' })
  public name: string;

  @Column('json')
  public label: LocalizedString;

  @Column()
  public type: string;

  @Column()
  public isRequired: boolean;

  @Column('json', { nullable: true })
  public placeholder: LocalizedString | null;

  @Column('json', { nullable: true })
  public options: QuestionOption[] | null;

  @Column('json', { default: {} })
  public scoring: Record<string, unknown>;

  @ManyToOne((_type) => ProgramEntity, (program) => program.programQuestions)
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

  @Column('json', {
    default: [ExportType.allPeopleAffected, ExportType.included],
  })
  public export: ExportType[];

  @Column({ type: 'character varying', nullable: true })
  public pattern: string | null;

  @Column({ default: false })
  public duplicateCheck: boolean;

  @Column({ default: false })
  public showInPeopleAffectedTable: boolean;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.programQuestion,
  )
  public registrationData: Relation<RegistrationDataEntity[]>;

  @Column({ default: false })
  public editableInPortal: boolean;

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: RegistrationDataEntity,
        columnName: 'programRegistrationAttributeId',
      },
    ]);
  }
}
