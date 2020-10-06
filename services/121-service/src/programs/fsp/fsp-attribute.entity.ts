import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';

@Entity('fsp_attribute')
@Unique(['name'])
export class FspAttributeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column('json')
  public label: JSON;

  @Column('json', { nullable: true })
  public placeholder: JSON;

  @Column('json', { nullable: true })
  public options: JSON;

  @Column()
  public answerType: string;

  @ManyToOne(
    _type => FinancialServiceProviderEntity,
    fsp => fsp.attributes,
  )
  public fsp: FinancialServiceProviderEntity;
}
