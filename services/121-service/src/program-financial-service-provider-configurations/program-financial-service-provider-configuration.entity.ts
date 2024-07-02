import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { isObject } from 'lodash';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

@Unique('programFspConfigurationUnique', ['programId', 'fspId', 'name'])
@Entity('program_fsp_configuration')
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
  @JoinColumn({ name: 'fspId' })
  public fsp: Relation<FinancialServiceProviderEntity>;
  @Column()
  public fspId: number;

  @Column()
  public name: string;

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
}
