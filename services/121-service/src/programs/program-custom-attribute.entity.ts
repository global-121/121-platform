import {
  Entity,
  Column,
  ManyToOne,
  Index,
  OneToMany,
  Unique,
  JoinColumn,
} from 'typeorm';
import { ProgramEntity } from './program.entity';
import { Base121Entity } from '../base.entity';
import { CustomAttributeType } from './dto/create-program-custom-attribute.dto';
import { ExportType } from '../export-metrics/dto/export-details';
import { RegistrationDataEntity } from '../registration/registration-data.entity';

@Unique('programCustomAttributeUnique', ['name', 'programId'])
@Entity('program_custom_attribute')
export class ProgramCustomAttributeEntity extends Base121Entity {
  @Column()
  @Index({ unique: true })
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
