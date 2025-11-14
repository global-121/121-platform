import {
  DataSource,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Relation,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LastTransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/last-transaction-event.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { UILanguageTranslationPartial } from '@121-service/src/shared/types/ui-language-translation-partial.type';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('t.*')
      .addSelect('event.errorMessage', 'errorMessage')
      .addSelect('event.programFspConfigurationId', 'programFspConfigurationId')
      .addSelect('fspconfig.label', 'programFspConfigurationLabel')
      .addSelect('fspconfig.name', 'programFspConfigurationName')
      .addSelect('fspconfig.fspName', 'fspName')
      .from(TransactionEntity, 't')
      .innerJoin(LastTransactionEventEntity, 'lte', 't.id = lte.transactionId')
      .leftJoin(
        TransactionEventEntity,
        'event',
        'lte.transactionEventId = event.id',
      )
      .leftJoin(
        ProgramFspConfigurationEntity,
        'fspconfig',
        'event.programFspConfigurationId = fspconfig.id',
      ),
})
export class TransactionViewEntity extends Base121AuditedEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @ViewColumn()
  public transferValue: number | null;

  @ViewColumn()
  @Index()
  public status: TransactionStatusEnum;

  @ManyToOne((_type) => PaymentEntity, (payment) => payment.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentId' })
  public payment: Relation<PaymentEntity>;

  @Index()
  @ViewColumn()
  public paymentId: number;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.transactions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;

  @Index()
  @ViewColumn()
  public registrationId: number;

  @OneToMany(
    () => TransactionEventEntity,
    (transactionEvent) => transactionEvent.transaction,
    { cascade: true },
  )
  public transactionEvents: Relation<TransactionEventEntity[]>;

  @OneToOne(
    () => LastTransactionEventEntity,
    (lastTransactionEvent) => lastTransactionEvent.transaction,
    { onDelete: 'NO ACTION' },
  )
  public lastTransactionEvent: Relation<LastTransactionEventEntity>;

  @ViewColumn()
  public errorMessage: string | null;

  @ViewColumn()
  public programFspConfigurationId: number | null; // can be null if program fsp config was deleted

  @ViewColumn()
  public programFspConfigurationLabel: UILanguageTranslationPartial | null; // can be null if program fsp config was deleted

  @ViewColumn()
  public programFspConfigurationName: string | null; // can be null if program fsp config was deleted

  @ViewColumn()
  public fspName: Fsps | null; // can be null if program fsp config was deleted
}
