import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';

@Entity('intersolve_voucher_instruction')
export class IntersolveVoucherInstructionsEntity extends Base121Entity {
  @Column({ type: 'bytea' })
  public image: any;

  @ManyToOne(() => ProgramEntity)
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column({ type: 'int', nullable: true })
  public programId: number | null;
}
