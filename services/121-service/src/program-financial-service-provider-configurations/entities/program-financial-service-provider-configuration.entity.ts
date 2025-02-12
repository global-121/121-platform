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
import { ProjectFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';
import { ProjectEntity } from '@121-service/src/programs/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Unique('projectFinancialServiceProviderConfigurationUnique', [
  'projectId',
  'name',
])
@Entity('project_financial_service_provider_configuration')
export class ProjectFinancialServiceProviderConfigurationEntity extends Base121Entity {
  @ManyToOne(
    (_type) => ProjectEntity,
    (project) => project.projectFinancialServiceProviderConfigurations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'projectId' })
  @Column()
  public projectId: number;

  @Column({ type: 'character varying' })
  public financialServiceProviderName: FinancialServiceProviders;

  @Column({ type: 'character varying' })
  public name: string;

  @Column('json')
  public label: LocalizedString;

  @OneToMany(
    (_type) => ProjectFinancialServiceProviderConfigurationPropertyEntity,
    (projectFinancialServiceProviderConfigurationProperty) =>
      projectFinancialServiceProviderConfigurationProperty.projectFinancialServiceProviderConfiguration,
    { cascade: ['insert'] },
  )
  public properties: Relation<
    ProjectFinancialServiceProviderConfigurationPropertyEntity[]
  >;

  @OneToMany(
    (_type) => TransactionEntity,
    (transactions) => transactions.projectFinancialServiceProviderConfiguration,
  )
  public transactions: Relation<TransactionEntity[]>;

  @OneToMany(
    (_type) => RegistrationEntity,
    (registrations) =>
      registrations.projectFinancialServiceProviderConfiguration,
  )
  public registrations: Relation<RegistrationEntity[]>;
}
