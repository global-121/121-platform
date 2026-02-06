import {
  AfterLoad,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { parseFspConfigurationPropertyValue } from '@121-service/src/fsp-integrations/shared/helpers/parse-fsp-configuration-value.helper';
import { serializeFspConfigurationPropertyValue } from '@121-service/src/fsp-integrations/shared/helpers/serialize-fsp-configuration-value.helper';
import { FspConfigurationPropertyType } from '@121-service/src/fsp-integrations/shared/types/fsp-configuration-property.type';
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
      to: (value: FspConfigurationPropertyType) => {
        return serializeFspConfigurationPropertyValue(value);
      },
      from: (value: string | string[]) => {
        //parsing happens in AfterLoad
        return value;
      },
    },
  })
  public value: FspConfigurationPropertyType;

  @AfterLoad()
  parseValue(): void {
    this.value = parseFspConfigurationPropertyValue({
      name: this.name,
      value: this.value as string,
    });
  }

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
