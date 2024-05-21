import { Base121Entity } from '@121-service/src/base.entity';
import { IntersolveVoucherResultCode } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-result-code.enum';
import { Column, Entity } from 'typeorm';

@Entity('intersolve_issue_voucher_request')
export class IntersolveIssueVoucherRequestEntity extends Base121Entity {
  @Column({ type: 'bigint' })
  public refPos: number;

  @Column({ nullable: true })
  public EAN: string | null;

  @Column()
  public value: number;

  @Column({ nullable: true })
  public clientReference: number | null;

  @Column({ nullable: true })
  public resultCodeIssueCard: IntersolveVoucherResultCode | null;

  @Column({ nullable: true })
  public cardId: string | null;

  // The values stored in this column should be 6 digits however some entries could be missing their first
  // 0 because convert this value from string to number. Currently however the data stores in this
  // column is never used. But when we do use this data we have to find a solution for this.
  @Column({ nullable: true })
  public PIN: number | null;

  @Column({ nullable: true })
  public balance: number | null;

  // TODO: REFACTOR: into a JoinColumn with the Transaction Entity
  @Column({ nullable: true })
  public transactionId: number | null;

  @Column({ default: false })
  public isCancelled: boolean;

  @Column({ default: 0 })
  public cancellationAttempts: number;

  @Column({ nullable: true })
  public cancelByRefPosResultCode: IntersolveVoucherResultCode | null;

  @Column({ nullable: true })
  public cancelResultCode: IntersolveVoucherResultCode | null;

  @Column({ default: false })
  public toCancel: boolean;
}
