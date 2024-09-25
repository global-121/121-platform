import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';

import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration-property.entity';

import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Unique('programFinancialServiceProviderConfigurationUnique', [
  'programId',
  'name',
])
@Entity('program_financial_service_provider_configuration')
export class ProgramFinancialServiceProviderConfigurationEntity extends CascadeDeleteEntity {
  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programFinancialServiceProviderConfigurations,
  )
  @JoinColumn({ name: 'programId' })
  @Column()
  public programId: number;

  @Column({ type: 'character varying' })
  public financialServiceProviderName: FinancialServiceProviders;

  @Column({ type: 'character varying' })
  public name: string;

  @Column('json')
  public label: LocalizedString;

  @OneToMany(
    (_type) => ProgramFinancialServiceProviderConfigurationPropertyEntity,
    (programFinancialServiceProviderConfigurationProperty) =>
      programFinancialServiceProviderConfigurationProperty.programFinancialServiceProviderConfiguration,
    { cascade: true },
  )
  public properties: Relation<
    ProgramFinancialServiceProviderConfigurationPropertyEntity[]
  >;

  @OneToMany(
    (_type) => TransactionEntity,
    (transactions) => transactions.programFinancialServiceProviderConfiguration,
  )
  public transactions: Relation<TransactionEntity[]>;
}
