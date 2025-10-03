import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

import { Base121OptionalAuditedEntity } from '@121-service/src/base-audited.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('transaction_event')
export class TransactionEventEntity extends Base121OptionalAuditedEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' }) // Do not delete on deleting users, instead see catch in userService.delete()
  @JoinColumn({ name: 'userId' })
  public user?: Relation<UserEntity>;

  @Column({ type: 'character varying' })
  @Index()
  public type: TransactionEventType;

  @Column({ type: 'character varying' })
  public description: TransactionEventDescription;

  @Column({ type: 'boolean' })
  public isSuccessfullyCompleted: boolean;

  @Column({ type: 'character varying', nullable: true })
  public errorMessage: string | null;

  @ManyToOne(
    (_type) => TransactionEntity,
    (transaction) => transaction.transactionEvents,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'transactionId' })
  public transaction: Relation<TransactionEntity>;
  @Index()
  @Column({ type: 'int' })
  public transactionId: number;

  @ManyToOne(
    (_type) => ProgramFspConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.transactions,
    { onDelete: 'SET NULL' },
  )
  @JoinColumn({
    name: 'programFspConfigurationId',
  })
  public programFspConfiguration: Relation<ProgramFspConfigurationEntity>;
  @Index()
  @Column({ type: 'int', nullable: true }) // Is nullable for when you delete a programFspConfiguration
  public programFspConfigurationId: number;
}
