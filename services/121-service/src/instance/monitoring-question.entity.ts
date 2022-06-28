import { InstanceEntity } from './instance.entity';
import { RegistrationDataEntity } from './../registration/registration-data.entity';
import { CascadeDeleteEntity } from './../base.entity';
import {
  Entity,
  Column,
  ManyToOne,
  BeforeUpdate,
  Index,
  OneToMany,
  BeforeRemove,
} from 'typeorm';

@Entity('monitoring_question')
export class MonitoringQuestionEntity extends CascadeDeleteEntity {
  @Column('json')
  public intro: JSON;

  @Column('json')
  public conclusion: JSON;

  @Column('json', { nullable: true })
  public options: JSON;

  @ManyToOne(
    _type => InstanceEntity,
    instance => instance.monitoringQuestions,
  )
  public instance: InstanceEntity;

  @OneToMany(
    () => RegistrationDataEntity,
    registrationData => registrationData.monitoringQuestion,
  )
  public registrationData: RegistrationDataEntity[];
}
