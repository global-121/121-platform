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
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';

@Unique('registrationProjectAttributeUnique', [
  'registrationId',
  'projectRegistrationAttributeId',
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
    (_type) => ProjectRegistrationAttributeEntity,
    (projectRegistrationAttribute) =>
      projectRegistrationAttribute.registrationAttributeData,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'projectRegistrationAttributeId' })
  public projectRegistrationAttribute: Relation<ProjectRegistrationAttributeEntity>;
  @Column({ type: 'integer' })
  public projectRegistrationAttributeId: number;

  @Index()
  @Column()
  public value: string;

  public async getDataName(): Promise<string | void> {
    const repo = AppDataSource.getRepository(RegistrationAttributeDataEntity);
    const dataWithRelations = await repo.findOneOrFail({
      where: { id: Equal(this.id) },
      relations: ['projectRegistrationAttribute'],
    });
    if (dataWithRelations.projectRegistrationAttribute) {
      return dataWithRelations.projectRegistrationAttribute.name;
    }
  }
}
