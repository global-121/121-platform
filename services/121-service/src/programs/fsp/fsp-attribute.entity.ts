import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { ProgramEntity } from '../program/program.entity';
import { TransactionEntity } from '../program/transactions.entity';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';


@Entity('fsp_attribute')
export class FspAttributeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column('json')
  public label: JSON;

  @Column('json', { nullable: true })
  public options: JSON;

  @ManyToOne(_type => FinancialServiceProviderEntity, fsp => fsp.attributes)
  public fsp: FinancialServiceProviderEntity;
}
