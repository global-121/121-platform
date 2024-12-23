import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Unique('programFinancialServiceProviderConfigurationUnique', [
  'programId',
  'name',
])
@Entity('program_financial_service_provider_configuration')
export class ProgramFinancialServiceProviderConfigurationEntity extends Base121Entity {
  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programFinancialServiceProviderConfigurations,
    { onDelete: 'CASCADE' },
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
    { cascade: ['insert'] },
  )
  public properties: Relation<
    ProgramFinancialServiceProviderConfigurationPropertyEntity[]
  >;

  @OneToMany(
    (_type) => TransactionEntity,
    (transactions) => transactions.programFinancialServiceProviderConfiguration,
  )
  public transactions: Relation<TransactionEntity[]>;

  @OneToMany(
    (_type) => RegistrationEntity,
    (registrations) =>
      registrations.programFinancialServiceProviderConfiguration,
  )
  public registrations: Relation<RegistrationEntity[]>;
}
