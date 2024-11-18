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
import { FinancialServiceProviderConfigurationEnum } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { WrapperType } from '@121-service/src/wrapper.type';

@Unique('programFspConfigurationUnique', ['programId', 'fspId', 'name'])
@Entity('program_fsp_configuration')
export class ProgramFspConfigurationEntity extends CascadeDeleteEntity {
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
  @JoinColumn({ name: 'fspId' })
  public fsp: Relation<FinancialServiceProviderEntity>;
  @Column()
  public fspId: number;

  @Column({ type: 'character varying' })
  public name: WrapperType<FinancialServiceProviderConfigurationEnum>;

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

          return parsedValue.toString();
        } catch (error) {
          return value;
        }
      },
    },
  })
  public value: string | string[] | Record<string, string>;
}
