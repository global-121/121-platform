import { RegistrationEntity } from './registration.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  AfterLoad,
} from 'typeorm';
import { ProgramQuestionEntity } from '../programs/program/program-question.entity';
import { Base121Entity } from '../base.entity';

@Entity('program_answer')
export class ProgramAnswerEntity extends Base121Entity {
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

  public name: string;

  @AfterLoad()
  public setName(): void {
    if (this.programQuestion) {
      this.name = this.programQuestion.name;
    }
  }
}
