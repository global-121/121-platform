import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { ProgramEntity } from './program.entity';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';

@Entity('fsp')
export class FinancialServiceProviderEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public fsp: string;

  @ManyToMany(_type => ProgramEntity, program => program.financialServiceProviders)
  public program: ProgramEntity[];

  @OneToMany(_type => ConnectionEntity, connection => connection.fsp)
  public connection: ConnectionEntity[];
}
