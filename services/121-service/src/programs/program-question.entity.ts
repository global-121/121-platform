import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { ExportType } from '../export-metrics/dto/export-details';
import { CascadeDeleteEntity } from './../base.entity';
import { RegistrationDataEntity } from './../registration/registration-data.entity';
import { ProgramEntity } from './program.entity';

@Unique('programQuestionUnique', ['name', 'programId'])
@Entity('program_question')
export class ProgramQuestionEntity extends CascadeDeleteEntity {
  @Column()
  public name: string;

  @Column('json')
  public label: JSON;

  @Column()
  public answerType: string;

  @Column('json', { nullable: true })
  public placeholder: JSON;

  @Column()
  public questionType: string;

  @Column('json', { nullable: true })
  public options: JSON;

  @Column('json')
  public scoring: JSON;

  @ManyToOne(
    _type => ProgramEntity,
    program => program.programQuestions,
  )
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
  public programId: number;

  @Column({ default: true })
  public persistence: boolean;

  @Column('json', {
    default: [
      ExportType.allPeopleAffected,
      ExportType.included,
      ExportType.selectedForValidation,
    ],
  })
  public export: JSON;

  @Column({ nullable: true })
  public pattern: string;

  @Column({ default: false })
  public duplicateCheck: boolean;

  @Column('json', { default: [] })
  public phases: JSON;

  @OneToMany(
    () => RegistrationDataEntity,
    registrationData => registrationData.programQuestion,
  )
  public registrationData: RegistrationDataEntity[];

  @Column({ default: false })
  public editableInPortal: boolean;

  @Column('json', { nullable: true })
  public shortLabel: JSON;
}
