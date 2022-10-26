import { Column, Entity } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { IntersolveResultCode } from './enum/intersolve-result-code.enum';

@Entity('intersolve_request')
export class IntersolveRequestEntity extends Base121Entity {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @Column({ type: 'bigint' })
  public refPos: number;

  @Column({ nullable: true })
  public EAN: string;

  @Column()
  public value: number;

  @Column({ nullable: true })
  public clientReference: number;

  @Column({ nullable: true })
  public resultCodeIssueCard: IntersolveResultCode;

  @Column({ nullable: true })
  public cardId: string;

  // The values stored in this column should be 6 digits however some entries could be missing their first
  // 0 because convert this value from string to number. Currently however the data stores in this
  // column is never used. But when we do use this data we have to find a solution for this.
  @Column({ nullable: true })
  public PIN: number;

  @Column({ nullable: true })
  public balance: number;

  @Column({ nullable: true })
  public transactionId: number;

  @Column({ default: false })
  public isCancelled: boolean;

  @Column({ default: 0 })
  public cancellationAttempts: number;

  @Column({ nullable: true })
  public cancelByRefPosResultCode: IntersolveResultCode;

  @Column({ nullable: true })
  public cancelResultCode: IntersolveResultCode;

  @Column({ default: false })
  public toCancel: boolean;
}
