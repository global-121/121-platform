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
import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';

@Unique('programFspConfigurationPropertyUnique', [
  'programFspConfigurationId',
  'name',
])
@Entity('program_fsp_configuration_property')
export class ProgramFspConfigurationPropertyEntity extends Base121Entity {
  @Column({ type: 'character varying' })
  public name: FspConfigurationProperties;

  @Column({
    type: 'varchar',
    transformer: {
      to: (value: unknown) => {
        if (Array.isArray(value) || isObject(value)) {
          return JSON.stringify(value);
        }

        return value;
      },
      from: (value: string) => {
        try {
          const parsedValue = JSON.parse(value);
          if (Array.isArray(parsedValue) || isObject(parsedValue)) {
            return parsedValue;
          }

          return value;
        } catch {
          return value;
        }
      },
    },
  })
  public value: string | string[] | Record<string, string>;

  @ManyToOne(
    (_type) => ProgramFspConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.properties,
    { cascade: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'programFspConfigurationId' })
  public programFspConfiguration: Relation<ProgramFspConfigurationEntity>;
  @Column()
  public programFspConfigurationId: number;
}
