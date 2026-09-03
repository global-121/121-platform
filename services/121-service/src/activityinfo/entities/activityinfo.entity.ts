import { Column, Entity, Index, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

@Entity('activityinfo')
export class ActivityInfoEntity extends Base121Entity {
  @Column({ nullable: false, type: 'varchar' })
  public formId: string;

  @Column({ type: 'character varying' })
  public token: string;

  // ActivityInfo assigns a monotonically increasing schema version per form.
  // Stored as a string because the API serializes it inconsistently as either
  // a number or a string.
  @Column({ type: 'character varying' })
  public schemaVersion: string;

  @Column({ type: 'character varying' })
  public url: string;

  @OneToOne(() => ProgramEntity, (program) => program.activityInfo, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Index()
  @Column({ type: 'int' })
  public programId: number;

  @Column({ type: 'character varying', nullable: true })
  public name: string | null;
}
