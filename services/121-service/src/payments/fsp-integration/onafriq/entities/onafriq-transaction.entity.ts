import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';

@Entity('onafriq_transaction')
export class OnafriqTransactionEntity extends Base121Entity {
  @Column({ unique: true })
  public thirdPartyTransId: string;

  @Column({ type: 'character varying', nullable: true })
  public mfsTransId: string | null;

  @Column()
  public recipientMsisdn: string;

  @OneToOne(() => TransactionEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;
  @Column({ type: 'int', nullable: false })
  public transactionId: number;
}
