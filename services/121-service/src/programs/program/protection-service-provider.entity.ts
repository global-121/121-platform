import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';
import { ProgramEntity } from './program.entity';

@Entity('psp')
export class ProtectionServiceProviderEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public psp: string;

  @ManyToMany(_type => ProgramEntity, program => program.protectionServiceProviders)
  public program: ProgramEntity[];
}
