import { isObject } from 'lodash';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CascadeDeleteEntity } from '../../base.entity';
import { FinancialServiceProviderEntity } from '../../financial-service-provider/financial-service-provider.entity';
import { ProgramEntity } from '../program.entity';

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
  public fsp: FinancialServiceProviderEntity;
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

          return parsedValue.toString();
        } catch (error) {
          return value;
        }
      },
    },
  })
  public value: string | string[] | Record<string, string>;
}
