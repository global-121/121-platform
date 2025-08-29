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
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';

@Unique('projectFspConfigurationPropertyUnique', [
  'projectFspConfigurationId',
  'name',
])
@Entity('project_fsp_configuration_property')
export class ProjectFspConfigurationPropertyEntity extends Base121Entity {
  @Column({ type: 'character varying' })
  public name: FspConfigurationProperties;

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
    (_type) => ProjectFspConfigurationEntity,
    (projectFspConfiguration) => projectFspConfiguration.properties,
    { cascade: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'projectFspConfigurationId' })
  public projectFspConfiguration: Relation<ProjectFspConfigurationEntity>;
  @Column()
  public projectFspConfigurationId: number;
}
