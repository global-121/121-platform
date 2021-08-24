import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Base121Entity } from '../base.entity';

@Entity('intersolve_instruction')
export class IntersolveInstructionsEntity extends Base121Entity {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @Column({ type: 'bytea' })
  public image: any;
}
