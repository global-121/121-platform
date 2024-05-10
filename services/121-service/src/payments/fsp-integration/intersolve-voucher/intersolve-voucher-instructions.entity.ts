import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { ProgramEntity } from '../../../programs/program.entity';

@Entity('intersolve_voucher_instruction')
export class IntersolveVoucherInstructionsEntity extends Base121Entity {
  @Column({ type: 'bytea' })
  public image: any;

  @ManyToOne(() => ProgramEntity)
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column({ type: 'int', nullable: true })
  public programId: number | null;
}
