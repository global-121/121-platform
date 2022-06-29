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
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column()
  public registrationId: number;

  @ManyToOne(
    _type => ProgramQuestionEntity,
    programQuestion => programQuestion.registrationData,
  )
  @JoinColumn({ name: 'programQuestionId' })
  public programQuestion: ProgramQuestionEntity;
  @Column({ nullable: true })
  public programQuestionId: number;

  @ManyToOne(
    _type => FspQuestionEntity,
    fspQuestion => fspQuestion.registrationData,
  )
  @JoinColumn({ name: 'fspQuestionId' })
  public fspQuestion: FspQuestionEntity;
  @Column({ nullable: true })
  public fspQuestionId: number;

  @ManyToOne(
    _type => ProgramCustomAttributeEntity,
    programCustomAttribute => programCustomAttribute.registrationData,
  )
  @JoinColumn({ name: 'programCustomAttributeId' })
  public programCustomAttribute: ProgramCustomAttributeEntity;
  @Column({ nullable: true })
  public programCustomAttributeId: number;

  @ManyToOne(
    _type => MonitoringQuestionEntity,
    monitoringQuestion => monitoringQuestion.registrationData,
  )
  @JoinColumn({ name: 'monitoringQuestionId' })
  public monitoringQuestion: MonitoringQuestionEntity;
  @Column({ nullable: true })
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
