import { Column, Entity } from 'typeorm';
import { Base121Entity } from '../../../base.entity';

@Entity('intersolve_instruction')
export class IntersolveInstructionsEntity extends Base121Entity {
  @Column({ type: 'bytea' })
  public image: any;
}
