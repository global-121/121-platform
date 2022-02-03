import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { Base121Entity } from '../base.entity';

@Entity('program_custom_attribute')
export class ProgramCustomAttributeEntity extends Base121Entity {
  @Column()
  @Index({ unique: true })
  public name: string;

  @Column()
  public type: string;

  @Column('json')
  public label: JSON;

  @ManyToOne(
    _type => ProgramEntity,
    program => program.programCustomAttributes,
  )
  public program: ProgramEntity;
}
