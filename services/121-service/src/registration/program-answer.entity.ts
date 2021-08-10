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
export class ProgramAnswersEntity {
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
  )
  public programQuestion: ProgramQuestionEntity;

  @Column()
  public answer: string;
}
