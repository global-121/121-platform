import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';

@Entity('fsp_call_log')
export class FspCallLogEntity {
  @PrimaryGeneratedColumn()
  public id: number;

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
