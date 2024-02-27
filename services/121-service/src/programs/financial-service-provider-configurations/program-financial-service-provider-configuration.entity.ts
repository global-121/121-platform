import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CascadeDeleteEntity } from '../../base.entity';
import { FinancialServiceProviderEntity } from '../../financial-service-providers/financial-service-provider.entity';
import { ProgramEntity } from '../program.entity';

@Unique('programFinancialServiceProviderConfigurationUnique', ['programId', 'financialServiceProviderId', 'name'])
@Entity('program_financial_service_provider_configuration')
export class ProgramFinancialServiceProviderConfigurationEntity extends CascadeDeleteEntity {
  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programFspConfiguration,
  )
  @JoinColumn({ name: 'programId' })
  @Column()
  public programId: number;

  @ManyToOne(
    (_type) => FinancialServiceProviderEntity,
    (fsp) => fsp.configuration,
  )
  @JoinColumn({ name: 'financialServiceProviderId' })
  public financialServiceProvider: FinancialServiceProviderEntity;
  @Column()
  public financialServiceProviderId: number;

  @Column()
  public name: string;

  @Column()
  public value: string;
}
