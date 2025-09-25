import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { LatestMessageEntity } from '@121-service/src/notifications/entities/latest-message.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { ImageCodeExportVouchersEntity } from '@121-service/src/payments/imagecode/entities/image-code-export-vouchers.entity';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { ReferenceIdConstraints } from '@121-service/src/shared/const';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { WrapperType } from '@121-service/src/wrapper.type';

@Unique('registrationProgramUnique', ['programId', 'registrationProgramId'])
@Check(`"referenceId" NOT IN (${ReferenceIdConstraints})`)
@Entity('registration')
export class RegistrationEntity extends Base121Entity {
  @ManyToOne((_type) => ProgramEntity, (program) => program.registrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

  // Refactor: remove this relationship as it is PA-app legacy
  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' }) // Do not delete on deleting users, instead see catch in userService.delete()
  public user: Relation<UserEntity>;

  @Index()
  @Column({ type: 'character varying', nullable: true })
  public registrationStatus: RegistrationStatusEnum | null;

  @Index({ unique: true })
  @Column()
  public referenceId: string;

  @OneToMany(() => RegistrationAttributeDataEntity, (data) => data.registration)
  public data: Relation<RegistrationAttributeDataEntity[]>;

  @Column({ type: 'character varying', nullable: true })
  public phoneNumber: string | null;

  @Column({ type: 'character varying', nullable: true })
  @IsEnum(LanguageEnum)
  public preferredLanguage: WrapperType<LanguageEnum | null>;

  @Index({ unique: false })
  @Column({ type: 'integer', nullable: true })
  public inclusionScore: number | null;

  @ManyToOne((_type) => ProgramFspConfigurationEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'programFspConfigurationId',
  })
  public programFspConfiguration: Relation<ProgramFspConfigurationEntity>;
  @Column({ type: 'integer', nullable: true })
  public programFspConfigurationId: number;

  @Column({ type: 'float', nullable: false, default: 1 })
  @IsPositive()
  @IsNotEmpty()
  public paymentAmountMultiplier: number;

  /** This is an "auto" incrementing field with a registration ID per program. */
  // NOTE: REFACTOR: rename to sequenceInProgram for better intuitive understanding of this field
  @Column()
  @Index()
  public registrationProgramId: number;

  @Column({ nullable: true, type: 'integer' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  public maxPayments?: number | null;

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
  public transactions: Relation<TransactionEntity[]>;

  @OneToMany(
    (_type) => ImageCodeExportVouchersEntity,
    (image) => image.registration,
  )
  public images: Relation<ImageCodeExportVouchersEntity[]>;

  @OneToMany(
    (_type) => TwilioMessageEntity,
    (twilioMessages) => twilioMessages.registration,
  )
  public twilioMessages: Relation<TwilioMessageEntity[]>;

  @OneToMany(
    (_type) => WhatsappPendingMessageEntity,
    (whatsappPendingMessages) => whatsappPendingMessages.registration,
  )
  public whatsappPendingMessages: Relation<WhatsappPendingMessageEntity[]>;

  @OneToMany(
    () => LatestTransactionEntity,
    (latestTransactions) => latestTransactions.registration,
  )
  public latestTransactions: Relation<LatestTransactionEntity[]>;

  @OneToOne(
    () => LatestMessageEntity,
    (latestMessage) => latestMessage.registration,
    { onDelete: 'NO ACTION' },
  )
  public latestMessage: Relation<LatestMessageEntity>;

  @OneToMany(() => NoteEntity, (notes) => notes.registration)
  public notes: Relation<NoteEntity[]>;

  @OneToMany(() => RegistrationEventEntity, (events) => events.registration)
  public events: Relation<RegistrationEventEntity[]>;

  // TODO: add some database constraints to make sure that scope is always lowercase
  // TODO: DO not make this nullable but set everything to empty string in migration
  @Index()
  @Column({ nullable: false, default: '' })
  public scope: string;

  @OneToOne(
    () => IntersolveVisaCustomerEntity,
    (intersolveVisaCustomer) => intersolveVisaCustomer.registration,
    { onDelete: 'NO ACTION' },
  )
  public intersolveVisaCustomer: Relation<IntersolveVisaCustomerEntity>;
}
