import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';

// One row per level of the access group hierarchy configured for a program (e.g. level 0 = region, level 1 = district).
@Unique('programAccessGroupLevelUnique', ['programId', 'level'])
@Unique('programAccessGroupLevelAttributeUnique', [
  'programId',
  'programRegistrationAttributeId',
])
@Entity('program_access_group_level')
export class AccessGroupLevelEntity extends Base121Entity {
  @Column()
  public level: number;

  @ManyToOne(() => ProgramEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

  @ManyToOne(() => ProgramRegistrationAttributeEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programRegistrationAttributeId' })
  public programRegistrationAttribute: Relation<ProgramRegistrationAttributeEntity>;
  @Column()
  public programRegistrationAttributeId: number;
}
