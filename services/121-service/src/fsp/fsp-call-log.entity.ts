import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';

@Entity('fsp_call_log')
export class FspCallLogEntity extends Base121Entity {
  @ManyToOne(
    _type => FinancialServiceProviderEntity,
    fsp => fsp.logs,
  )
  public fsp: FinancialServiceProviderEntity;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @Column('json', { default: null })
  public payload: JSON;

  @Column({ nullable: true })
  public status: string;

  @Column('json', { default: null })
  public response: JSON;
}
