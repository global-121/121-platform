import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { CascadeDeleteEntity } from './../base.entity';
import { RegistrationDataEntity } from './../registration/registration-data.entity';
import { InstanceEntity } from './instance.entity';

@Entity('monitoring_question')
export class MonitoringQuestionEntity extends CascadeDeleteEntity {
  @Column()
  public name: string;

  @Column('json')
  public intro: JSON;

  @Column('json')
  public conclusion: JSON;

  @Column('json', { nullable: true })
  public options: JSON;

  @OneToOne(
    () => InstanceEntity,
    instance => instance.monitoringQuestion,
  )
  public instance: InstanceEntity;

  @OneToMany(
    () => RegistrationDataEntity,
    registrationData => registrationData.monitoringQuestion,
  )
  public registrationData: RegistrationDataEntity[];
}
