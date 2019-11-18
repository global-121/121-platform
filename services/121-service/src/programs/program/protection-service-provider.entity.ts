import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { ProgramEntity } from './program.entity';

@Entity('psp')
export class ProtectionServiceProviderEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public psp: string;

  @ManyToOne(_type => ProgramEntity, program => program.protectionServiceProviders)
  public program: ProgramEntity[];
}
