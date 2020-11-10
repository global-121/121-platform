import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ImageCodeExportVouchersEntity } from '../../notifications/imagecode/image-code-export-vouchers.entity';
import { IntersolveResultCode } from './api/enum/intersolve-result-code.enum';

@Entity('intersolve_request')
export class IntersolveRequestEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: number;

  @Column()
  public refpos: number;

  @Column()
  public ean: number;

  @Column()
  public value: number;

  @Column({ nullable: true })
  public clientReference: number;

  @Column()
  public resultCodeIssueCard: IntersolveResultCode;

  @Column()
  public cardId: string;

  @Column()
  public pin: number;

  @Column()
  public blance: number;

  @Column()
  public transactionId: number;

  @Column({ default: false })
  public cancelled: boolean;

  @Column()
  public cancelAttempts: number;

  @Column()
  public cancelByRefposrResultCode: IntersolveResultCode;
}
