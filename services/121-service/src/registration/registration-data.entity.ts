import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AppDataSource } from '../../appdatasource';
import { Base121Entity } from '../base.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { FspQuestionEntity } from './../fsp/fsp-question.entity';
import { ProgramCustomAttributeEntity } from './../programs/program-custom-attribute.entity';
import { RegistrationEntity } from './registration.entity';

@Unique('registrationProgramQuestionUnique', [
  'registrationId',
  'programQuestionId',
  'value',
])
@Unique('registrationFspQuestionUnique', [
  'registrationId',
  'fspQuestionId',
  'value',
])
@Unique('registrationProgramCustomAttributeUnique', [
  'registrationId',
  'programCustomAttributeId',
])
@Entity('registration_data')
export class RegistrationDataEntity extends Base121Entity {
  @ManyToOne((_type) => RegistrationEntity, (registration) => registration.data)
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Index()
  @Column()
  public registrationId: number;

  @ManyToOne(
    (_type) => ProgramQuestionEntity,
    (programQuestion) => programQuestion.registrationData,
  )
  @JoinColumn({ name: 'programQuestionId' })
  public programQuestion: ProgramQuestionEntity;
  @Column({ nullable: true })
  public programQuestionId: number;

  @ManyToOne(
    (_type) => FspQuestionEntity,
    (fspQuestion) => fspQuestion.registrationData,
  )
  @JoinColumn({ name: 'fspQuestionId' })
  public fspQuestion: FspQuestionEntity;
  @Column({ nullable: true })
  public fspQuestionId: number;

  @ManyToOne(
    (_type) => ProgramCustomAttributeEntity,
    (programCustomAttribute) => programCustomAttribute.registrationData,
  )
  @JoinColumn({ name: 'programCustomAttributeId' })
  public programCustomAttribute: ProgramCustomAttributeEntity;
  @Column({ nullable: true })
  public programCustomAttributeId: number;

  @Index()
  @Column()
  public value: string;

  public async getDataName(): Promise<string> {
    const repo = AppDataSource.getRepository(RegistrationDataEntity);
    const dataWithRelations = await repo.findOne({
      where: { id: this.id },
      relations: ['programQuestion', 'fspQuestion', 'programCustomAttribute'],
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
  }
}
