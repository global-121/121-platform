import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { LatestMessageEntity } from '@121-service/src/notifications/latest-message.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-customer.entity';
import { ImageCodeExportVouchersEntity } from '@121-service/src/payments/imagecode/image-code-export-vouchers.entity';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { ReferenceIdConstraints } from '@121-service/src/shared/const';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { UserEntity } from '@121-service/src/user/user.entity';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import {
  BeforeRemove,
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';

@Unique('registrationProgramUnique', ['programId', 'registrationProgramId'])
@Check(`"referenceId" NOT IN (${ReferenceIdConstraints})`)
@Entity('registration')
export class RegistrationEntity extends CascadeDeleteEntity {
  @ManyToOne((_type) => ProgramEntity, (program) => program.registrations)
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
  public programId: number;

  @ManyToOne(() => UserEntity)
  public user: UserEntity;

  @Index()
  @Column({ nullable: true })
  public registrationStatus: RegistrationStatusEnum | null;

  @Index({ unique: true })
  @Column()
  public referenceId: string;

  @OneToMany(() => RegistrationDataEntity, (data) => data.registration)
  public data: RegistrationDataEntity[];

  @Column({ nullable: true })
  public phoneNumber: string | null;

  @Column({ nullable: true })
  @IsEnum(LanguageEnum)
  public preferredLanguage: LanguageEnum | null;

  @Index({ unique: false })
  @Column({ nullable: true })
  public inclusionScore: number | null;

  @ManyToOne((_type) => FinancialServiceProviderEntity)
  @JoinColumn({ name: 'fspId' })
  public fsp: FinancialServiceProviderEntity;
  @Column({ nullable: true })
  public fspId: number | null;

  @Column({ nullable: false, default: 1 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public paymentAmountMultiplier: number;

  /** This is an "auto" incrementing field with a registration ID per program. */
  // NOTE: REFACTOR: rename to sequenceInProgram for better intuitive understanding of this field
  @Column()
  @Index()
  public registrationProgramId: number;

  @Column({ nullable: true })
  @IsInt()
  @IsPositive()
  @IsOptional()
  public maxPayments?: number;

  // This is a count of the number of transactions with a distinct on the paymentId
  // can be failed or successful or waiting transactions
  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  public paymentCount?: number;

  @OneToMany(
    (_type) => TransactionEntity,
    (transactions) => transactions.registration,
  )
  public transactions: TransactionEntity[];

  @OneToMany(
    (_type) => ImageCodeExportVouchersEntity,
    (image) => image.registration,
  )
  public images: ImageCodeExportVouchersEntity[];

  @OneToMany(
    (_type) => TwilioMessageEntity,
    (twilioMessages) => twilioMessages.registration,
  )
  public twilioMessages: TwilioMessageEntity[];

  @OneToMany(
    (_type) => WhatsappPendingMessageEntity,
    (whatsappPendingMessages) => whatsappPendingMessages.registration,
  )
  public whatsappPendingMessages: WhatsappPendingMessageEntity[];

  @OneToMany(
    () => LatestTransactionEntity,
    (latestTransactions) => latestTransactions.registration,
  )
  public latestTransactions: LatestTransactionEntity[];

  @OneToOne(
    () => LatestMessageEntity,
    (latestMessage) => latestMessage.registration,
  )
  public latestMessage: LatestMessageEntity;

  @OneToMany(() => NoteEntity, (notes) => notes.registration)
  public notes: NoteEntity[];

  @OneToMany(() => EventEntity, (events) => events.registration)
  public events: EventEntity[];

  // TODO: add some database constraints to make sure that scope is always lowercase
  // TODO: DO not make this nullable but set everything to empty string in migration
  // Also not use the setting {default: ''} because than we will forget to set it later just one time '' in the migration
  @Index()
  @Column({ nullable: false, default: '' })
  public scope: string;

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    // The order of these calls is important, because of foreign key constraints
    // Please check if it still works if you change the order
    await this.deleteAllOneToMany([
      {
        entityClass: ImageCodeExportVouchersEntity,
        columnName: 'registration',
      },
      {
        entityClass: LatestMessageEntity,
        columnName: 'registration',
      },
      {
        entityClass: TwilioMessageEntity,
        columnName: 'registration',
      },
      {
        entityClass: LatestTransactionEntity,
        columnName: 'registration',
      },
      {
        entityClass: TransactionEntity,
        columnName: 'registration',
      },
      {
        entityClass: RegistrationDataEntity,
        columnName: 'registration',
      },
      {
        entityClass: WhatsappPendingMessageEntity,
        columnName: 'registration',
      },
      {
        entityClass: TryWhatsappEntity,
        columnName: 'registration',
      },
      {
        entityClass: CommercialBankEthiopiaAccountEnquiriesEntity,
        columnName: 'registration',
      },
      {
        entityClass: NoteEntity,
        columnName: 'registration',
      },
      {
        entityClass: IntersolveVisaCustomerEntity,
        columnName: 'registration',
      },
    ]);
  }
}
