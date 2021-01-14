import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';

@Entity('fsp_attribute')
export class FspAttributeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Index({ unique: true })
  public name: string;

  @Column('json')
  public label: JSON;

  @Column('json', { nullable: true })
  public placeholder: JSON;

  @Column('json', { nullable: true })
  public options: JSON;

  @Column('json', {
    default: ['all-people-affected', 'included', 'selected-for-validation'],
  })
  public export: JSON;

  @Column()
  public answerType: string;

  @ManyToOne(
    _type => FinancialServiceProviderEntity,
    fsp => fsp.attributes,
  )
  public fsp: FinancialServiceProviderEntity;
}
