import { InstanceEntity } from './../instance/instance.entity';
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
import {
  RegistrationDataOptions,
  RegistrationDataRelation,
} from './dto/registration-data-relation.model';
import { HttpException, HttpStatus } from '@nestjs/common';

@Entity('registration')
export class RegistrationEntity extends CascadeDeleteEntity {
  @ManyToOne(
    type => ProgramEntity,
    program => program.registrations,
  )
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
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

  // @Column('json', {
  //   default: {},
  // })
  public customData: any;

  public async getRegistrationDataByName(
    name: string,
  ): Promise<RegistrationDataEntity> {
    const repo = getConnection().getRepository(RegistrationDataEntity);
    const result = await repo
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
      .andWhere(`programQuestion.name = :name`, { name: name })
      .orWhere(`fspQuestion.name = :name`, { name: name })
      .orWhere(`monitoringQuestion.name = :name`, { name: name })
      .orWhere(`programCustomAttribute.name = :name`, { name: name })
      .select(
        `CASE
          WHEN ("programQuestion"."name" is not NULL) THEN "programQuestion"."name"
          WHEN ("fspQuestion"."name" is not NULL) THEN "fspQuestion"."name"
          WHEN ("monitoringQuestion"."name" is not NULL) THEN "monitoringQuestion"."name"
          WHEN ("programCustomAttribute"."name" is not NULL) THEN "programCustomAttribute"."name"
        END as name,
        value`,
      )
      .getRawOne();
    return result;
  }

  // To save registration data you need either a relation or a name
  public async saveData(
    value: string | number | boolean,
    options: RegistrationDataOptions,
  ): Promise<RegistrationEntity> {
    try {
      let relation = options.relation;
      if (!options.relation && !options.name) {
        const errors = `Cannot save registration data, need either a dataRelation or a name`;
        throw new Error(errors);
      }
      if (!options.relation) {
        relation = await this.getRelationForName(options.name);
      }
      value = String(value);
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
    } catch (error) {
      console.log('error: ', error);
    }

    // Fetches updated registration from database and return it
    return await getConnection()
      .getRepository(RegistrationEntity)
      .findOne(this.id, { relations: ['data'] });
  }

  private async saveProgramQuestionData(
    value: string,
    id: number,
  ): Promise<void> {
    const repoRegistrationData = getConnection().getRepository(
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

  private async saveFspQuestionData(value: string, id: number): Promise<void> {
    console.log('saveFspQuestionData: ', value, id);
    const repoRegistrationData = getConnection().getRepository(
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

  private async saveProgramCustomAttributeData(
    value: string,
    id: number,
  ): Promise<void> {
    const repoRegistrationData = getConnection().getRepository(
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

  private async saveMonitoringQuestionData(
    value: string,
    id: number,
  ): Promise<void> {
    const repoRegistrationData = getConnection().getRepository(
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

  public async getRelationForName(
    name: string,
  ): Promise<RegistrationDataRelation> {
    const result = new RegistrationDataRelation();
    const repo = getConnection().getRepository(ProgramEntity);
    const query = repo
      .createQueryBuilder('program')
      .leftJoin('program.programQuestions', 'programQuestion')
      .where('program.id = :programId', { programId: this.program.id })
      .andWhere('programQuestion.name = :name', { name: name })
      .select('"programQuestion".id', 'id');

    const resultProgramQuestion = await query.getRawOne();

    // console.log('query: ', query.getSql());

    if (resultProgramQuestion) {
      result.programQuestionId = resultProgramQuestion.id;
      return result;
    }
    const resultFspQuestion = await repo
      .createQueryBuilder('program')
      .leftJoin('program.financialServiceProviders', 'fsp')
      .leftJoin('fsp.questions', 'question')
      .where('program.id = :programId', { programId: this.program.id })
      .andWhere('question.name = :name', { name: name })
      .select('"question".id', 'id')
      .getRawOne();
    if (resultFspQuestion) {
      result.fspQuestionId = resultFspQuestion.id;
      return result;
    }
    const resultProgramCustomAttribute = await repo
      .createQueryBuilder('program')
      .leftJoin('program.programCustomAttributes', 'programCustomAttribute')
      .where('program.id = :programId', { programId: this.program.id })
      .andWhere('programCustomAttribute.name = :name', { name: name })
      .select('"programCustomAttribute".id', 'id')
      .getRawOne();
    if (resultProgramCustomAttribute) {
      result.programCustomAttributeId = resultProgramCustomAttribute.id;
      return result;
    }
    const repoInstance = getConnection().getRepository(InstanceEntity);
    const resultMonitoringQuestion = await repoInstance
      .createQueryBuilder('instance')
      .leftJoin('instance.monitoringQuestion', 'question')
      .andWhere('question.name = :name', { name: name })
      .select('"question".id', 'id')
      .getRawOne();
    if (resultMonitoringQuestion) {
      result.monitoringQuestionId = resultMonitoringQuestion.id;
      return result;
    }
    const errors = `Cannot save registration data, name: '${name}' not found (In program questions, fsp questions, monitoring questions and program custom attributes)`;
    throw new Error(errors);
  }
}
