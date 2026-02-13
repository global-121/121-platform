import { Column, Entity, Index, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

@Entity('kobo')
export class KoboEntity extends Base121Entity {
  @Column({ nullable: false, unique: true, type: 'varchar' })
  public assetUid: string;

  @Column({ type: 'character varying' })
  public token: string;

  @Column({ type: 'character varying' })
  public versionId: string;

  @Column({ type: 'date' })
  public dateDeployed: Date;

  @Column({ type: 'character varying' })
  public url: string;

  @OneToOne(() => ProgramEntity, (program) => program.kobo, {
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
