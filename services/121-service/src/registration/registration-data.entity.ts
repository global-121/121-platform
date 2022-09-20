import { FspQuestionEntity } from './../fsp/fsp-question.entity';
import { ProgramCustomAttributeEntity } from './../programs/program-custom-attribute.entity';
import { RegistrationEntity } from './registration.entity';
import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  getConnection,
  Unique,
} from 'typeorm';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { Base121Entity } from '../base.entity';
import { MonitoringQuestionEntity } from '../instance/monitoring-question.entity';

// @Unique('registrationProgramQuestionUnique', [
//   'registrationId',
//   'programQuestionId',
// ])
@Unique('registrationFspQuestionUnique', ['registrationId', 'fspQuestionId'])
@Unique('registrationProgramCustomAttributeUnique', [
  'registrationId',
  'programCustomAttributeId',
])
@Unique('registrationMonitoringQuestionUnique', [
  'registrationId',
  'monitoringQuestionId',
])
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

  public async getDataName(): Promise<string> {
    const repo = getConnection().getRepository(RegistrationDataEntity);
    const dataWithRelations = await repo.findOne(this.id, {
      relations: [
        'programQuestion',
        'fspQuestion',
        'programCustomAttribute',
        'monitoringQuestion',
      ],
    });
    if (dataWithRelations.programQuestion) {
      return dataWithRelations.programQuestion.name;
    }
    if (dataWithRelations.fspQuestion) {
      return dataWithRelations.fspQuestion.name;
    }
    if (dataWithRelations.programCustomAttribute) {
      return dataWithRelations.programCustomAttribute.name;
    }
    if (dataWithRelations.monitoringQuestion) {
      return dataWithRelations.monitoringQuestion.name;
    }
  }
}
