import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';

@Entity('excel_fsp_configuration')
export class ExcelFspConfigurationEntity extends Base121Entity {
  @OneToOne(() => ProgramFspConfigurationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programFspConfigurationId' })
  public programFspConfiguration: Relation<ProgramFspConfigurationEntity>;

  @Column()
  public programFspConfigurationId: number;

  @Column({ type: 'character varying' })
  public uniqueIdentifierField: string;

  @Column('text', { array: true, default: () => "'{}'" })
  public exportFields: string[];
}
