import {
  BeforeRemove,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { CascadeDeleteEntity } from './../base.entity';
import { CustomAttributeType } from './dto/create-program-custom-attribute.dto';
import { ProgramEntity } from './program.entity';

@Unique('programCustomAttributeUnique', ['name', 'programId'])
@Entity('program_custom_attribute')
export class ProgramCustomAttributeEntity extends CascadeDeleteEntity {
  @Column()
  public name: string;

  @Column()
  public type: CustomAttributeType;

  @Column('json')
  public label: JSON;

  @Column('json', { default: [] })
  public phases: JSON;

  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programCustomAttributes,
  )
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;

  @Column()
  public programId: number;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.programCustomAttribute,
  )
  public registrationData: RegistrationDataEntity[];

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: RegistrationDataEntity,
        columnName: 'programCustomAttributeId',
      },
    ]);
  }
}
