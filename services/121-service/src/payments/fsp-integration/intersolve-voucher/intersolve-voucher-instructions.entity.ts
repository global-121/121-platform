import { Column, Entity } from 'typeorm';
import { Base121Entity } from '../../../base.entity';

@Entity('intersolve_voucher_instruction')
export class IntersolveVoucherInstructionsEntity extends Base121Entity {
  @Column({ type: 'bytea' })
  public image: any;
}
