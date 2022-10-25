import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { MonitoringQuestionEntity } from './monitoring-question.entity';

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
  public contactDetails: JSON;

  @OneToOne(
    () => MonitoringQuestionEntity,
    monitoringQuestion => monitoringQuestion.instance,
    {
      cascade: true,
    },
  )
  @JoinColumn()
  public monitoringQuestion: MonitoringQuestionEntity;
}
