import { FspQuestionEntity } from './../fsp/fsp-question.entity';
import { ProgramCustomAttributeEntity } from './../programs/program-custom-attribute.entity';
import { RegistrationEntity } from './registration.entity';
import { Entity, Column, JoinColumn, ManyToOne, AfterLoad } from 'typeorm';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { Base121Entity } from '../base.entity';
import { MonitoringQuestionEntity } from '../instance/monitoring-question.entity';

@Entity('registration_data')
export class RegistrationDataEntity extends Base121Entity {
  @ManyToOne(
    _type => RegistrationEntity,
    registration => registration.data,
  )
  public registration: RegistrationEntity;
  @JoinColumn({ name: 'registrationId' })
  public registrationId: number;

  @ManyToOne(
    _type => ProgramQuestionEntity,
    programQuestion => programQuestion.registrationData,
    {
      eager: true,
    },
  )
  @JoinColumn({ name: 'programQuestionId' })
  public programQuestion: ProgramQuestionEntity;
  @Column()
  public programQuestionId: number;

  @ManyToOne(
    _type => FspQuestionEntity,
    fspQuestion => fspQuestion.registrationData,
    {
      eager: true,
    },
  )
  @JoinColumn({ name: 'fspQuestionId' })
  public fspQuestion: FspQuestionEntity;
  @Column()
  public fspQuestionId: number;

  @ManyToOne(
    _type => ProgramCustomAttributeEntity,
    programCustomAttribute => programCustomAttribute.registrationData,
    {
      eager: true,
    },
  )
  @JoinColumn({ name: 'programCustomAttributeId' })
  public programCustomAttribute: ProgramCustomAttributeEntity;
  @Column()
  public programCustomAttributeId: number;

  @ManyToOne(
    _type => MonitoringQuestionEntity,
    monitoringQuestion => monitoringQuestion.registrationData,
    {
      eager: true,
    },
  )
  @JoinColumn({ name: 'monitoringQuestionId' })
  public monitoringQuestion: MonitoringQuestionEntity;
  @Column()
  public monitoringQuestionId: number;

  @Column()
  public value: string;

  // public name: string;
  // @AfterLoad()
  // public setName(): void {
  //   if (this.programQuestion) {
  //     this.name = this.programQuestion.name;
  //   } else if (this.fspQuestion) {
  //     this.name = this.fspQuestion.name;
  //   } else if
  // }
}
