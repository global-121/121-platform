import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { Base121Entity } from '../base.entity';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { CustomAttributeType } from './dto/create-program-custom-attribute.dto';
import { ProgramEntity } from './program.entity';

@Unique('programCustomAttributeUnique', ['name', 'programId'])
@Entity('program_custom_attribute')
export class ProgramCustomAttributeEntity extends Base121Entity {
  @Column()
  public name: string;

  @Column()
  public type: CustomAttributeType;

  @Column('json')
  public label: JSON;

  @Column('json', { default: [] })
  public phases: JSON;

  @ManyToOne(
    _type => ProgramEntity,
    program => program.programCustomAttributes,
  )
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
  public programId: number;

  @OneToMany(
    () => RegistrationDataEntity,
    registrationData => registrationData.programQuestion,
  )
  public registrationData: RegistrationDataEntity[];
}
