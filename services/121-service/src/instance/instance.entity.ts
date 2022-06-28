import { MonitoringQuestionEntity } from './monitoring-question.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Base121Entity } from '../base.entity';

@Entity('instance')
export class InstanceEntity extends Base121Entity {
  @Column()
  public name: string;

  @Column('json')
  public displayName: JSON;

  @Column('json', { nullable: true, default: null })
  public logoUrl: JSON;

  @Column('json', { nullable: true, default: null })
  public dataPolicy: JSON;

  @Column('json', { nullable: true, default: null })
  public aboutProgram: JSON;

  @Column('json', { nullable: true, default: null })
  public contactDetails: JSON;

  @OneToMany(
    () => MonitoringQuestionEntity,
    monitoringQuestions => monitoringQuestions.instance,
  )
  public monitoringQuestions: MonitoringQuestionEntity[];
}
