import { Entity, Column, ManyToOne } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';

@Entity('fsp_attribute')
export class FspAttributeEntity extends Base121Entity {
  @Column()
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

  @Column('json', { default: [] })
  public phases: JSON;

  @Column({ default: false })
  public editableInPortal: boolean;

  @ManyToOne(
    _type => FinancialServiceProviderEntity,
    fsp => fsp.attributes,
  )
  public fsp: FinancialServiceProviderEntity;
}
