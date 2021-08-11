import { RegistrationEntity } from './registration.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ProgramQuestionEntity } from '../programs/program/program-question.entity';

@Entity('program_answer')
export class ProgramAnswerEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(
    _type => RegistrationEntity,
    registration => registration.programAnswers,
  )
  public registration: RegistrationEntity;

  @ManyToOne(
    _type => ProgramQuestionEntity,
    programQuestion => programQuestion.programAnswers,
    {
      eager: true,
    },
  )
  @JoinColumn({ name: 'programQuestionId' })
  public programQuestion: ProgramQuestionEntity;

  @Column()
  public programQuestionId: number;

  @Column()
  public programAnswer: string;
}
