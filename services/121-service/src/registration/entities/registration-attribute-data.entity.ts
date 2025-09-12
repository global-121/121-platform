import {
  Column,
  Entity,
  Equal,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { AppDataSource } from '@121-service/src/appdatasource';
import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Unique('registrationProgramAttributeUnique', [
  'registrationId',
  'programRegistrationAttributeId',
])
@Entity('registration_attribute_data')
export class RegistrationAttributeDataEntity extends Base121Entity {
  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.data,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Index()
  @Column()
  public registrationId: number;

  @ManyToOne(
    (_type) => ProgramRegistrationAttributeEntity,
    (programRegistrationAttribute) =>
      programRegistrationAttribute.registrationAttributeData,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'programRegistrationAttributeId' })
  public programRegistrationAttribute: Relation<ProgramRegistrationAttributeEntity>;
  @Column({ type: 'integer' })
  public programRegistrationAttributeId: number;

  @Index()
  @Column()
  public value: string;

  public async getDataName(): Promise<string | void> {
    const repo = AppDataSource.getRepository(RegistrationAttributeDataEntity);
    const dataWithRelations = await repo.findOneOrFail({
      where: { id: Equal(this.id) },
      relations: ['programRegistrationAttribute'],
    });
    if (dataWithRelations.programRegistrationAttribute) {
      return dataWithRelations.programRegistrationAttribute.name;
    }
  }
}
