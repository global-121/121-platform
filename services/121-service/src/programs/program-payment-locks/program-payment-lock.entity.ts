import {
  BaseEntity,
  Column,
  Index,
  JoinColumn,
  OneToOne,
  Relation,
} from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

export class ProgramPaymentLockEntity extends BaseEntity {
  @Index({ unique: true })
  @OneToOne(() => ProgramEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column({ type: 'int', nullable: false })
  public programId: number;
}
