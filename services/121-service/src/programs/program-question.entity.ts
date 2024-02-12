import { ApiProperty } from '@nestjs/swagger';
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
import { ExportType } from '../metrics/dto/export-details.dto';
import { NameConstraintQuestions } from '../shared/const';
import { CascadeDeleteEntity } from './../base.entity';
import { RegistrationDataEntity } from './../registration/registration-data.entity';
import { ProgramEntity } from './program.entity';

@Unique('programQuestionUnique', ['name', 'programId'])
@Check(`"name" NOT IN (${NameConstraintQuestions})`)
@Entity('program_question')
export class ProgramQuestionEntity extends CascadeDeleteEntity {
  @Column()
  @ApiProperty({ example: 'question1' })
  public name: string;

  @Column('json')
  @ApiProperty({ example: { en: 'label' } })
  public label: JSON;

  @Column()
  @ApiProperty({ example: 'tel' })
  public answerType: string;

  @Column('json', { nullable: true })
  @ApiProperty({ example: { en: 'placeholder' } })
  public placeholder: JSON;

  @Column()
  @ApiProperty({ example: 'standard' })
  public questionType: string;

  @Column('json', { nullable: true })
  @ApiProperty({ example: [] })
  public options: JSON;

  @Column('json')
  @ApiProperty({ example: {} })
  public scoring: JSON;

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
  public export: JSON;

  @Column({ nullable: true })
  @ApiProperty({ example: 'pattern' })
  public pattern: string;

  @Column({ default: false })
  @ApiProperty({ example: false })
  public duplicateCheck: boolean;

  @Column('json', { default: [] })
  @ApiProperty({ example: [] })
  public phases: JSON;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.programQuestion,
  )
  public registrationData: RegistrationDataEntity[];

  @Column({ default: false })
  @ApiProperty({ example: false })
  public editableInPortal: boolean;

  @Column('json', { nullable: true })
  @ApiProperty({ example: { en: 'shortLabel' } })
  public shortLabel: JSON;

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
