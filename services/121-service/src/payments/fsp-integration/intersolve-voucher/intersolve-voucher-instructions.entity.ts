import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProjectEntity } from '@121-service/src/projects/project.entity';

@Entity('intersolve_voucher_instruction')
export class IntersolveVoucherInstructionsEntity extends Base121Entity {
  @Column({ type: 'bytea' })
  public image: any;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  public project: Relation<ProjectEntity>;
  @Column({ type: 'int', nullable: false })
  public projectId: number;
}
