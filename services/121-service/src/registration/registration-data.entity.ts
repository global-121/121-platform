import { AppDataSource } from '@121-service/appdatasource';
import { Base121Entity } from '@121-service/src/base.entity';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

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
  @Column({ type: 'integer', nullable: true })
  public programQuestionId: number | null;

  @ManyToOne(
    (_type) => FspQuestionEntity,
    (fspQuestion) => fspQuestion.registrationData,
  )
  @JoinColumn({ name: 'fspQuestionId' })
  public fspQuestion: FspQuestionEntity;
  @Column({ type: 'integer', nullable: true })
  public fspQuestionId: number | null;

  @ManyToOne(
    (_type) => ProgramCustomAttributeEntity,
    (programCustomAttribute) => programCustomAttribute.registrationData,
  )
  @JoinColumn({ name: 'programCustomAttributeId' })
  public programCustomAttribute: ProgramCustomAttributeEntity;
  @Column({ type: 'integer', nullable: true })
  public programCustomAttributeId: number | null;

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
