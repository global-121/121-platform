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
  Brackets,
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  QueryFailedError,
  Unique,
} from 'typeorm';
import { AppDataSource } from '../../appdatasource';
import { CascadeDeleteEntity } from '../base.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { NoteEntity } from '../notes/note.entity';
import { LatestMessageEntity } from '../notifications/latest-message.entity';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { TryWhatsappEntity } from '../notifications/whatsapp/try-whatsapp.entity';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '../payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { ImageCodeExportVouchersEntity } from '../payments/imagecode/image-code-export-vouchers.entity';
import { LatestTransactionEntity } from '../payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ReferenceIdConstraints } from '../shared/const';
import { UserEntity } from '../user/user.entity';
import { InstanceEntity } from './../instance/instance.entity';
import { WhatsappPendingMessageEntity } from './../notifications/whatsapp/whatsapp-pending-message.entity';
import { RegistrationDataByNameDto } from './dto/registration-data-by-name.dto';
import {
  RegistrationDataOptions,
  RegistrationDataRelation,
} from './dto/registration-data-relation.model';
import { LanguageEnum } from './enum/language.enum';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationDataError } from './errors/registration-data.error';
import { RegistrationChangeLogEntity } from './modules/registration-change-log/registration-change-log.entity';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';

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

  @OneToMany(
    () => RegistrationStatusChangeEntity,
    (statusChange) => statusChange.registration,
  )
  @JoinColumn()
  public statusChanges: RegistrationStatusChangeEntity[];

  @Index()
  @Column({ nullable: true })
  public registrationStatus: RegistrationStatusEnum;

  @Index({ unique: true })
  @Column()
  public referenceId: string;

  @OneToMany(() => RegistrationDataEntity, (data) => data.registration)
  public data: RegistrationDataEntity[];

  @OneToMany(
    () => RegistrationChangeLogEntity,
    (changes) => changes.registration,
  )
  public changes: RegistrationChangeLogEntity[];

  @Column({ nullable: true })
  public phoneNumber: string;

  @Column({ nullable: true })
  @IsEnum(LanguageEnum)
  public preferredLanguage: LanguageEnum;

  @Index({ unique: false })
  @Column({ nullable: true })
  public inclusionScore: number;

  @ManyToOne((_type) => FinancialServiceProviderEntity)
  @JoinColumn({ name: 'fspId' })
  public fsp: FinancialServiceProviderEntity;
  @Column({ nullable: true })
  public fspId: number;

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
  public maxPayments: number;

  // This is a count of the number of transactions with a distinct on the paymentId
  // can be failed or successful or waiting transactions
  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  public paymentCount: number;

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
        entityClass: RegistrationChangeLogEntity,
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
      {
        entityClass: TryWhatsappEntity,
        columnName: 'registration',
      },
      {
        entityClass: LatestTransactionEntity,
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
    ]);
  }

  public async getRegistrationValueByName(name: string): Promise<string> {
    const registrationDataResult =
      await this.getRegistrationDataValueByName(name);
    if (registrationDataResult) {
      return registrationDataResult;
    } else {
      const registrationResult = this[name];
      if (registrationResult) {
        return registrationResult;
      }
    }
  }

  // TODO: Refactor this to accept an array of keys
  public async getRegistrationDataValueByName(name: string): Promise<string> {
    const result = await this.getRegistrationDataByName(name);
    if (!result || !result.value) {
      return null;
    } else {
      return result.value;
    }
  }

  public async getRegistrationDataByName(
    name: string,
  ): Promise<RegistrationDataByNameDto> {
    const repo = AppDataSource.getRepository(RegistrationDataEntity);
    const q = repo
      .createQueryBuilder('registrationData')
      .leftJoin('registrationData.registration', 'registration')
      .leftJoin('registrationData.programQuestion', 'programQuestion')
      .leftJoin('registrationData.fspQuestion', 'fspQuestion')
      .leftJoin('registrationData.monitoringQuestion', 'monitoringQuestion')
      .leftJoin(
        'registrationData.programCustomAttribute',
        'programCustomAttribute',
      )
      .where('registration.id = :id', { id: this.id })
      .andWhere(
        new Brackets((qb) => {
          qb.where(`programQuestion.name = :name`, { name: name })
            .orWhere(
              `(fspQuestion.name = :name AND "fspQuestion"."fspId" = :fsp)`,
              {
                name: name,
                fsp: this.fspId,
              },
            )
            .orWhere(`monitoringQuestion.name = :name`, {
              name: name,
            })
            .orWhere(`programCustomAttribute.name = :name`, {
              name: name,
            });
        }),
      )
      .select(
        `CASE
          WHEN ("programQuestion"."name" is not NULL) THEN "programQuestion"."name"
          WHEN ("fspQuestion"."name" is not NULL) THEN "fspQuestion"."name"
          WHEN ("monitoringQuestion"."name" is not NULL) THEN "monitoringQuestion"."name"
          WHEN ("programCustomAttribute"."name" is not NULL) THEN "programCustomAttribute"."name"
        END as name,
        value, "registrationData".id`,
      );
    const result = q.getRawOne();
    return result;
  }

  // To save registration data you need either a relation or a name
  public async saveData(
    value: string | number | boolean | string[],
    options: RegistrationDataOptions,
  ): Promise<RegistrationEntity> {
    let relation = options.relation;
    if (!options.relation && !options.name) {
      const errors = `Cannot save registration data, need either a dataRelation or a name`;
      throw new Error(errors);
    }
    if (!options.relation) {
      relation = await this.getRelationForName(options.name);
    }
    if (Array.isArray(value)) {
      await this.saveMultipleData(value, relation);
    } else {
      await this.saveOneData(value, relation);
    }

    return await AppDataSource.getRepository(RegistrationEntity).findOne({
      relations: ['data'],
      where: {
        id: this.id,
      },
    });
  }

  private async saveOneData(
    value: string | number | boolean,
    relation: RegistrationDataRelation,
  ): Promise<void> {
    value = value === undefined || value === null ? '' : String(value);

    if (relation.programQuestionId) {
      await this.saveProgramQuestionData(value, relation.programQuestionId);
    }
    if (relation.fspQuestionId) {
      await this.saveFspQuestionData(value, relation.fspQuestionId);
    }
    if (relation.programCustomAttributeId) {
      await this.saveProgramCustomAttributeData(
        value,
        relation.programCustomAttributeId,
      );
    }
    if (relation.monitoringQuestionId) {
      await this.saveMonitoringQuestionData(
        value,
        relation.monitoringQuestionId,
      );
    }
  }

  private async saveMultipleData(
    value: string[],
    relation: RegistrationDataRelation,
  ): Promise<void> {
    if (relation.programQuestionId) {
      await this.saveProgramQuestionDataMultiSelect(
        value,
        relation.programQuestionId,
      );
    }
    if (relation.fspQuestionId) {
      await this.saveFspQuestionDataMultiSelect(value, relation.fspQuestionId);
    }
    if (relation.programCustomAttributeId) {
      await this.saveProgramCustomAttributeDataMultiSelect(
        value,
        relation.programCustomAttributeId,
      );
    }
    if (relation.monitoringQuestionId) {
      await this.saveMonitoringQuestionDataMultiSelect(
        value,
        relation.monitoringQuestionId,
      );
    }
  }

  private async saveProgramQuestionData(
    value: string,
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );
    const existingEntry = await repoRegistrationData
      .createQueryBuilder('registrationData')
      .where('"registrationId" = :regId', { regId: this.id })
      .leftJoin('registrationData.programQuestion', 'programQuestion')
      .andWhere('programQuestion.id = :id', { id: id })
      .getOne();
    if (existingEntry) {
      existingEntry.value = value;
      await repoRegistrationData.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registration = this;
      newRegistrationData.value = value;
      newRegistrationData.programQuestionId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveProgramQuestionDataMultiSelect(
    values: string[],
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );

    await repoRegistrationData.delete({
      registration: { id: this.id },
      programQuestion: { id: id },
    });

    for await (const value of values) {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registration = this;
      newRegistrationData.value = value;
      newRegistrationData.programQuestionId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveFspQuestionData(value: string, id: number): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );
    const existingEntry = await repoRegistrationData
      .createQueryBuilder('registrationData')
      .where('"registrationId" = :regId', { regId: this.id })
      .leftJoin('registrationData.fspQuestion', 'fspQuestion')
      .andWhere('fspQuestion.id = :id', { id: id })
      .getOne();
    if (existingEntry) {
      existingEntry.value = value;
      await repoRegistrationData.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registration = this;
      newRegistrationData.value = value;
      newRegistrationData.fspQuestionId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveFspQuestionDataMultiSelect(
    values: string[],
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );

    await repoRegistrationData.delete({
      registration: { id: this.id },
      fspQuestion: { id: id },
    });

    for await (const value of values) {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registration = this;
      newRegistrationData.value = value;
      newRegistrationData.fspQuestionId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveProgramCustomAttributeData(
    value: string,
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );
    const existingEntry = await repoRegistrationData
      .createQueryBuilder('registrationData')
      .where('"registrationId" = :regId', { regId: this.id })
      .leftJoin(
        'registrationData.programCustomAttribute',
        'programCustomAttribute',
      )
      .andWhere('programCustomAttribute.id = :id', { id: id })
      .getOne();
    if (existingEntry) {
      existingEntry.value = value;
      await repoRegistrationData.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registration = this;
      newRegistrationData.value = value;
      newRegistrationData.programCustomAttributeId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveProgramCustomAttributeDataMultiSelect(
    values: string[],
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );

    await repoRegistrationData.delete({
      registration: { id: this.id },
      programCustomAttribute: { id: id },
    });

    for await (const value of values) {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registration = this;
      newRegistrationData.value = value;
      newRegistrationData.programCustomAttributeId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveMonitoringQuestionData(
    value: string,
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );
    const existingEntry = await repoRegistrationData
      .createQueryBuilder('registrationData')
      .where('"registrationId" = :regId', { regId: this.id })
      .leftJoin('registrationData.monitoringQuestion', 'monitoringQuestion')
      .andWhere('monitoringQuestion.id = :id', { id: id })
      .getOne();
    if (existingEntry) {
      existingEntry.value = value;
      await repoRegistrationData.save(existingEntry);
    } else {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registration = this;
      newRegistrationData.value = value;
      newRegistrationData.monitoringQuestionId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  private async saveMonitoringQuestionDataMultiSelect(
    values: string[],
    id: number,
  ): Promise<void> {
    const repoRegistrationData = AppDataSource.getRepository(
      RegistrationDataEntity,
    );

    await repoRegistrationData.delete({
      registration: { id: this.id },
      monitoringQuestion: { id: id },
    });

    for await (const value of values) {
      const newRegistrationData = new RegistrationDataEntity();
      newRegistrationData.registration = this;
      newRegistrationData.value = value;
      newRegistrationData.monitoringQuestionId = id;
      await repoRegistrationData.save(newRegistrationData);
    }
  }

  public async getRelationForName(
    name: string,
  ): Promise<RegistrationDataRelation> {
    const result = new RegistrationDataRelation();
    const repoProgram = AppDataSource.getRepository(ProgramEntity);
    const query = repoProgram
      .createQueryBuilder('program')
      .leftJoin('program.programQuestions', 'programQuestion')
      .where('program.id = :programId', { programId: this.programId })
      .andWhere('programQuestion.name = :name', { name: name })
      .select('"programQuestion".id', 'id');

    const resultProgramQuestion = await query.getRawOne();

    if (resultProgramQuestion) {
      result.programQuestionId = resultProgramQuestion.id;
      return result;
    }
    const repoRegistration = AppDataSource.getRepository(RegistrationEntity);
    const resultFspQuestion = await repoRegistration
      .createQueryBuilder('registration')
      .leftJoin('registration.fsp', 'fsp')
      .leftJoin('fsp.questions', 'question')
      .where('registration.id = :registration', { registration: this.id })
      .andWhere('question.name = :name', { name: name })
      .andWhere('question."fspId" = :fsp', { fsp: this.fspId })
      .select('"question".id', 'id')
      .getRawOne();
    if (resultFspQuestion) {
      result.fspQuestionId = resultFspQuestion.id;
      return result;
    }
    const resultProgramCustomAttribute = await repoProgram
      .createQueryBuilder('program')
      .leftJoin('program.programCustomAttributes', 'programCustomAttribute')
      .where('program.id = :programId', { programId: this.programId })
      .andWhere('programCustomAttribute.name = :name', { name: name })
      .select('"programCustomAttribute".id', 'id')
      .getRawOne();
    if (resultProgramCustomAttribute) {
      result.programCustomAttributeId = resultProgramCustomAttribute.id;
      return result;
    }
    const repoInstance = AppDataSource.getRepository(InstanceEntity);
    const resultMonitoringQuestion = await repoInstance
      .createQueryBuilder('instance')
      .leftJoin('instance.monitoringQuestion', 'question')
      .where('question.name = :name', { name: name })
      .select('"question".id', 'id')
      .getRawOne();
    if (resultMonitoringQuestion) {
      result.monitoringQuestionId = resultMonitoringQuestion.id;
      return result;
    }
    const errorMessage = `Cannot find registration data, name: '${name}' not found (In program questions, fsp questions, monitoring questions and program custom attributes)`;
    throw new RegistrationDataError(errorMessage);
  }

  public async save(retryCount?: number): Promise<RegistrationEntity> {
    let saveRetriesCount = retryCount ? retryCount : 0;
    const regRepo = AppDataSource.getRepository(RegistrationEntity);
    if (!this.registrationProgramId) {
      const query = regRepo
        .createQueryBuilder('r')
        .select('r."registrationProgramId"')
        .where('r.programId = :programId', {
          programId: this.program.id,
        })
        .andWhere('r.registrationProgramId is not null')
        .orderBy('r."registrationProgramId"', 'DESC')
        .limit(1);
      const result = await query.getRawOne();
      this.registrationProgramId = result
        ? result.registrationProgramId + 1
        : 1;
    }
    try {
      return await regRepo.save(this);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // This is the error code for unique_violation (see: https://www.postgresql.org/docs/current/errcodes-appendix.html)
        if (error['code'] === '23505' && saveRetriesCount < 3) {
          saveRetriesCount++;
          this.registrationProgramId = null;
          await this.save(saveRetriesCount);
        }
        if (saveRetriesCount >= 3) {
          saveRetriesCount = 0;
          throw error;
        }
      }
    }
  }

  public async getFullName(): Promise<string> {
    const repoProgram = AppDataSource.getRepository(ProgramEntity);
    let fullName = '';
    const fullnameConcat = [];
    const program = await repoProgram.findOneBy({ id: this.programId });
    if (program && program.fullnameNamingConvention) {
      for (const nameColumn of JSON.parse(
        JSON.stringify(program.fullnameNamingConvention),
      )) {
        const singleName =
          await this.getRegistrationDataValueByName(nameColumn);
        if (singleName) {
          fullnameConcat.push(singleName);
        }
      }
      fullName = fullnameConcat.join(' ');
    }
    return fullName;
  }
}
