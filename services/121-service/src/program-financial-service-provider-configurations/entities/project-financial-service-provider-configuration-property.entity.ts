import { isObject } from 'lodash';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ProjectFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/project-financial-service-provider-configuration.entity';

@Unique('projectFinancialServiceProviderConfigurationPropertyUnique', [
  'projectFinancialServiceProviderConfigurationId',
  'name',
])
@Entity('project_financial_service_provider_configuration_property')
export class ProjectFinancialServiceProviderConfigurationPropertyEntity extends Base121Entity {
  @Column({ type: 'character varying' })
  public name: FinancialServiceProviderConfigurationProperties;

  @Column({
    type: 'varchar',
    transformer: {
      to: (value: any) => {
        if (Array.isArray(value) || isObject(value)) {
          return JSON.stringify(value);
        }

        return value;
      },
      from: (value: any) => {
        try {
          const parsedValue = JSON.parse(value);
          if (Array.isArray(parsedValue) || isObject(parsedValue)) {
            return parsedValue;
          }

          return value;
        } catch (error) {
          return value;
        }
      },
    },
  })
  public value: string | string[] | Record<string, string>;

  @ManyToOne(
    (_type) => ProjectFinancialServiceProviderConfigurationEntity,
    (projectFinancialServiceProviderConfiguration) =>
      projectFinancialServiceProviderConfiguration.properties,
    { cascade: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'projectFinancialServiceProviderConfigurationId' })
  public projectFinancialServiceProviderConfiguration: Relation<ProjectFinancialServiceProviderConfigurationEntity>;
  @Column()
  public projectFinancialServiceProviderConfigurationId: number;
}
