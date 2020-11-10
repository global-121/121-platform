import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IntersolveResultCode } from './api/enum/intersolve-result-code.enum';

@Entity('intersolve_request')
export class IntersolveRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: number;

  @Column()
  public refPos: number;

  @Column()
  public EAN: number;

  @Column()
  public value: number;

  @Column({ nullable: true })
  public clientReference: number;

  @Column()
  public resultCodeIssueCard: IntersolveResultCode;

  @Column({ nullable: true })
  public cardId: string;

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
}
