import { isObject } from 'lodash';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { FinancialServiceProviderConfigurationProperties } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';

@Unique('programFinancialServiceProviderConfigurationPropertyUnique', [
  'programFinancialServiceProviderConfigurationId',
  'name',
])
@Entity('program_financial_service_provider_configuration_property')
export class ProgramFinancialServiceProviderConfigurationPropertyEntity extends CascadeDeleteEntity {
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
    (_type) => ProgramFinancialServiceProviderConfigurationEntity,
    (programFinancialServiceProviderConfiguration) =>
      programFinancialServiceProviderConfiguration.properties,
    { cascade: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'programFinancialServiceProviderConfigurationId' })
  public programFinancialServiceProviderConfiguration: Relation<ProgramFinancialServiceProviderConfigurationEntity>;
  @Column()
  public programFinancialServiceProviderConfigurationId: number;
}
