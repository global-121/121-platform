import {
  DataSource,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  Relation,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LastTransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/last-transaction-event.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@ViewEntity({
  name: 'transaction_view',
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('t.id', 'id')
      .addSelect('t.transferValue', 'transferValue')
      .addSelect('t.userId', 'userId')
      .addSelect('t.created', 'created')
      .addSelect('t.updated', 'updated')
      .addSelect('t.status', 'status')
      .addSelect('t.paymentId', 'paymentId')
      .addSelect('t.registrationId', 'registrationId')
      .addSelect('event.errorMessage', 'errorMessage')
      .addSelect('event.programFspConfigurationId', 'programFspConfigurationId')
      .addSelect('fspconfig.label', 'programFspConfigurationLabel')
      .addSelect('fspconfig.name', 'programFspConfigurationName')
      .addSelect('fspconfig.fspName', 'fspName')
      .addSelect('registration.registrationStatus', 'registrationStatus')
      .addSelect('registration.registrationProgramId', 'registrationProgramId')
      .addSelect('registration.referenceId', 'registrationReferenceId')
      .addSelect('registration.scope', 'registrationScope')
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
      )
      .leftJoin(
        RegistrationEntity,
        'registration',
        't.registrationId = registration.id',
      ),
})
export class TransactionViewEntity {
  @ViewColumn()
  @PrimaryColumn()
  public id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @ViewColumn()
  public transferValue: number | null;

  @ViewColumn()
  public userId: number;

  @ViewColumn()
  public created: Date;

  @ViewColumn()
  public updated: Date;

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
  public programFspConfigurationLabel: UILanguageTranslation | null; // can be null if program fsp config was deleted

  @ViewColumn()
  public programFspConfigurationName: string | null; // can be null if program fsp config was deleted

  @ViewColumn()
  public fspName: Fsps | null; // can be null if program fsp config was deleted

  @ViewColumn()
  public registrationStatus: RegistrationStatusEnum | null;

  @ViewColumn()
  public registrationProgramId: number | null;

  @ViewColumn()
  public registrationReferenceId: string | null;

  @ViewColumn()
  public registrationScope: string | null;
}
