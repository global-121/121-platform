import {
  Entity,
  Column,
  ManyToOne,
  BeforeUpdate,
  Index,
  OneToMany,
} from 'typeorm';
import { ProgramEntity } from './program.entity';
import { ProgramAnswerEntity } from '../registration/program-answer.entity';
import { Base121Entity } from '../base.entity';
import { ExportType } from '../export-metrics/dto/export-details';

@Entity('program_question')
export class ProgramQuestionEntity extends Base121Entity {
  @Column()
  @Index({ unique: true })
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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.updated = new Date();
  }

  @ManyToOne(
    _type => ProgramEntity,
    program => program.programQuestions,
  )
  public program: ProgramEntity;

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

  @OneToMany(
    () => ProgramAnswerEntity,
    programAnswer => programAnswer.programQuestion,
  )
  public programAnswers: ProgramAnswerEntity[];
}
