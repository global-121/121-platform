import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { NameConstraintQuestions } from '@121-service/src/shared/const';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedString } from 'src/shared/enum/language.enums';
import { QuestionOption } from 'src/shared/enum/question.enums';
import {
  BeforeRemove,
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

@Unique('programQuestionUnique', ['name', 'programId'])
@Check(`"name" NOT IN (${NameConstraintQuestions})`)
@Entity('program_question')
export class ProgramQuestionEntity extends CascadeDeleteEntity {
  @Column()
  @ApiProperty({ example: 'question1' })
  public name: string;

  @Column('json')
  @ApiProperty({ example: { en: 'label' } })
  public label: LocalizedString;

  @Column()
  @ApiProperty({ example: 'tel' })
  public answerType: string;

  @Column('json', { nullable: true })
  @ApiProperty({ example: { en: 'placeholder' } })
  public placeholder: LocalizedString | null;

  @Column()
  @ApiProperty({ example: 'standard' })
  public questionType: string;

  @Column('json', { nullable: true })
  @ApiProperty({ example: [] })
  public options: QuestionOption[] | null;

  @Column('json')
  @ApiProperty({ example: {} })
  public scoring: Record<string, unknown>;

  @ManyToOne((_type) => ProgramEntity, (program) => program.programQuestions)
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
  public programId: number;

  @Column({ default: true })
  @ApiProperty({ example: true })
  public persistence: boolean;

  @Column('json', {
    default: [ExportType.allPeopleAffected, ExportType.included],
  })
  @ApiProperty({ example: [] })
  public export: ExportType[];

  @Column({ type: 'character varying', nullable: true })
  @ApiProperty({ example: 'pattern' })
  public pattern: string | null;

  @Column({ default: false })
  @ApiProperty({ example: false })
  public duplicateCheck: boolean;

  @Column({ default: false })
  @ApiProperty({ example: false })
  public showInPeopleAffectedTable: boolean;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.programQuestion,
  )
  public registrationData: RegistrationDataEntity[];

  @Column({ default: false })
  @ApiProperty({ example: false })
  public editableInPortal: boolean;

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: RegistrationDataEntity,
        columnName: 'programQuestionId',
      },
    ]);
  }
}
