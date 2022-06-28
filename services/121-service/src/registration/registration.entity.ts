import { ProgramQuestionEntity } from './../programs/program-question.entity';
import { WhatsappPendingMessageEntity } from './../notifications/whatsapp/whatsapp-pending-message.entity';
import { CascadeDeleteEntity } from './../base.entity';
import { UserEntity } from '../user/user.entity';
import {
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
  Column,
  OneToMany,
  BeforeRemove,
  getConnection,
} from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { LanguageEnum } from './enum/language.enum';
import { IsInt, IsPositive, IsOptional } from 'class-validator';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ImageCodeExportVouchersEntity } from '../payments/imagecode/image-code-export-vouchers.entity';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { RegistrationDataEntity } from './registration-data.entity';

@Entity('registration')
export class RegistrationEntity extends CascadeDeleteEntity {
  @ManyToOne(
    type => ProgramEntity,
    program => program.registrations,
  )
  public program: ProgramEntity;
  @JoinColumn({ name: 'programId' })
  public programId: number;

  @ManyToOne(() => UserEntity)
  public user: UserEntity;

  @OneToMany(
    () => RegistrationStatusChangeEntity,
    statusChange => statusChange.registration,
  )
  @JoinColumn()
  public statusChanges: RegistrationStatusChangeEntity[];

  @Index()
  @Column({ nullable: true })
  public registrationStatus: RegistrationStatusEnum;

  @Column({ nullable: true })
  public qrIdentifier: string;

  @Index({ unique: true })
  @Column()
  public referenceId: string;

  @OneToMany(
    () => RegistrationDataEntity,
    data => data.registration,
  )
  public data: RegistrationDataEntity[];

  @Column({ nullable: true })
  public phoneNumber: string;

  @Column({ nullable: true })
  public preferredLanguage: LanguageEnum;

  @Index({ unique: false })
  @Column({ nullable: true })
  public inclusionScore: number;

  @ManyToOne(_type => FinancialServiceProviderEntity)
  public fsp: FinancialServiceProviderEntity;

  @Column({ nullable: true })
  @IsInt()
  @IsPositive()
  @IsOptional()
  public paymentAmountMultiplier: number;

  @Column({ nullable: true })
  public note: string;

  @Column({ nullable: true })
  public noteUpdated: Date;

  @OneToMany(
    _type => TransactionEntity,
    transactions => transactions.registration,
  )
  public transactions: TransactionEntity[];

  @OneToMany(
    _type => ImageCodeExportVouchersEntity,
    image => image.registration,
  )
  public images: ImageCodeExportVouchersEntity[];

  @OneToMany(
    _type => TwilioMessageEntity,
    twilioMessages => twilioMessages.registration,
  )
  public twilioMessages: TwilioMessageEntity[];

  @OneToMany(
    _type => WhatsappPendingMessageEntity,
    whatsappPendingMessages => whatsappPendingMessages.registration,
  )
  public whatsappPendingMessages: WhatsappPendingMessageEntity[];

  // public customData: any;

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: ImageCodeExportVouchersEntity,
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
        entityClass: RegistrationStatusChangeEntity,
        columnName: 'registration',
      },
      {
        entityClass: TwilioMessageEntity,
        columnName: 'registration',
      },
      {
        entityClass: WhatsappPendingMessageEntity,
        columnName: 'registration',
      },
    ]);
  }

  public customData: any;

  public async getRegistrationDataByName(name: string): Promise<string> {
    const repo = getConnection().getRepository(RegistrationDataEntity);
    const result = await repo
      .createQueryBuilder('registrationData')
      .leftJoin('registrationData.registration', 'registration')
      .leftJoin('registrationData.programQuestion', 'programQuestion')
      .leftJoin('registrationData.fspQuestion', 'fspQuestion')
      .leftJoin('registrationData.monitoringQuestion', 'monitoringQuestionId')
      .leftJoin(
        'registrationData.programCustomAttribute',
        'programCustomAttribute',
      )
      .where('registration.id = :id', { id: this.id })
      .andWhere(`programQuestion.name = :name`, { name: name })
      .andWhere(`fspQuestion.name = :name`, { name: name })
      .andWhere(`monitoringQuestion.name = :name`, { name: name })
      .andWhere(`programCustomAttribute.name = :name`, { name: name })
      .select(
        `CASE
          WHEN ("programQuestion"."name" is not NULL) THEN "programQuestion"."name"
          WHEN ("fspQuestion"."name" is not NULL) THEN "fspQuestion"."name"
          WHEN ("monitoringQuestion"."name" is not NULL) THEN "monitoringQuestion"."name"
          WHEN ("programCustomAttribute"."name" is not NULL) THEN "programCustomAttribute"."name"
          ELSE "The quantity is under 30"
        END`,
        'name',
      )
      .getRawOne();
    console.log('result: ', result);
    return result.name;
  }

  public async createUpdateProgramQuestionData(
    name: string,
    value: string,
  ): Promise<void> {
    const repoRegistrationData = getConnection().getRepository(
      RegistrationDataEntity,
    );
    const existingEntry = await repoRegistrationData
      .createQueryBuilder('registrationData')
      .where('registrationId = :id', { id: this.id })
      .leftJoin('registrationData.programQuestion', 'programQuestion')
      .andWhere('programQuestion.name = :name', { name: name })
      .getOne();
    console.log('existingEntry: ', existingEntry);
    if (existingEntry) {
      existingEntry.value = value;
      await repoRegistrationData.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.value = value;
      newRegistrationData.programQuestion = await getConnection()
        .getRepository(ProgramQuestionEntity)
        .createQueryBuilder('programQuestion')
        .leftJoin('programQuestion.program', 'program')
        .where('programQuestion = :name', { name: name })
        .andWhere('program.id = :programId', { programId: this.programId })
        .getOne();
      console.log('newRegistrationData: ', newRegistrationData);
      this.data.push(newRegistrationData);
      await repoRegistrationData.save(existingEntry);
    }
  }
}
