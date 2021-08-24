import { ProgramQuestionEntity } from './program-question.entity';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
} from './dto/get-transaction.dto';
import { ActionService } from './../../actions/action.service';
import { TransactionEntity } from './transactions.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult, In } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { ProgramPhase } from '../../models/program-phase.model';
import { PaStatus } from '../../models/pa-status.model';
import { CreateProgramDto } from './dto';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
import { InclusionStatus } from './dto/inclusion-status.dto';
import {
  FinancialServiceProviderEntity,
  fspName,
} from '../fsp/financial-service-provider.entity';
import {
  ActionEntity,
  AdditionalActionType,
} from '../../actions/action.entity';
import { FspService } from '../fsp/fsp.service';
import { UpdateProgramQuestionDto } from './dto/update-program-question.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { PaPaymentDataDto } from '../fsp/dto/pa-payment-data.dto';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { StatusEnum } from '../../shared/enum/status.enum';
import { CustomDataAttributes } from '../../registration/dto/custom-data-attributes';
import { TotalIncluded } from './dto/payout.dto';
import { InstallmentStateSumDto } from './dto/installment-state-sum.dto';
import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';
import { RegistrationEntity } from '../../registration/registration.entity';
import { Attributes } from '../../registration/dto/update-attribute.dto';

@Injectable()
export class ProgramService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  public programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FspAttributeEntity)
  public fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private readonly actionService: ActionService,
    private readonly fspService: FspService,
  ) {}

  private async checkIfProgramExists(programId: number): Promise<void> {
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = `Program with ID "${programId}" not found.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
  }

  public async findOne(where): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne(where, {
      relations: [
        'programQuestions',
        'aidworkerAssignments',
        'aidworkerAssignments.user',
        'aidworkerAssignments.roles',
        'financialServiceProviders',
      ],
    });
    return program;
  }

  public async findAll(): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.programQuestions', 'programQuestion')
      .addOrderBy('programQuestion.id', 'ASC');

    qb.where('1 = 1');
    qb.orderBy('program.created', 'DESC');

    const programs = await qb.getMany();
    const programsCount = programs.length;

    return { programs, programsCount };
  }

  public async getPublishedPrograms(): Promise<ProgramsRO> {
    let programs = (await this.findAll()).programs;
    programs = programs.filter(program => program.published);
    const programsCount = programs.length;
    return { programs, programsCount };
  }

  public async create(
    userId: number,
    programData: CreateProgramDto,
  ): Promise<ProgramEntity> {
    let program = new ProgramEntity();
    program.location = programData.location;
    program.ngo = programData.ngo;
    program.title = programData.title;
    program.startDate = programData.startDate;
    program.endDate = programData.endDate;
    program.currency = programData.currency;
    program.distributionFrequency = programData.distributionFrequency;
    program.distributionDuration = programData.distributionDuration;
    program.fixedTransferValue = programData.fixedTransferValue;
    program.inclusionCalculationType = programData.inclusionCalculationType;
    program.minimumScore = programData.minimumScore;
    program.highestScoresX = programData.highestScoresX;
    program.meetingDocuments = programData.meetingDocuments;
    program.notifications = programData.notifications;
    program.phoneNumberPlaceholder = programData.phoneNumberPlaceholder;
    program.description = programData.description;
    program.descLocation = programData.descLocation;
    program.descHumanitarianObjective = programData.descHumanitarianObjective;
    program.descCashType = programData.descCashType;
    program.validation = programData.validation;
    program.programQuestions = [];
    program.financialServiceProviders = [];

    for (let programQuestion of programData.programQuestions) {
      let programQuestionReturn = await this.programQuestionRepository.save(
        programQuestion,
      );
      program.programQuestions.push(programQuestionReturn);
    }
    for (let item of programData.financialServiceProviders) {
      let fsp = await this.financialServiceProviderRepository.findOne({
        relations: ['program'],
        where: { id: item.id },
      });
      if (!fsp) {
        const errors = `No fsp found with id ${item.id}`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      fsp.program.push(program);
      await this.financialServiceProviderRepository.save(fsp);
    }

    const newProgram = await this.programRepository.save(program);
    return newProgram;
  }

  public async updateProgram(
    programId: number,
    updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = `No program found with id ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let attribute in updateProgramDto) {
      program[attribute] = updateProgramDto[attribute];
    }

    await this.programRepository.save(program);
    return program;
  }

  public async updateProgramQuestion(
    updateProgramQuestionDto: UpdateProgramQuestionDto,
  ): Promise<ProgramQuestionEntity> {
    const programQuestion = await this.programQuestionRepository.findOne({
      where: { name: updateProgramQuestionDto.name },
    });
    if (!programQuestion) {
      const errors = `No programQuestion found with name ${updateProgramQuestionDto.name}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let attribute in updateProgramQuestionDto) {
      if (attribute !== 'name') {
        programQuestion[attribute] = updateProgramQuestionDto[attribute];
      }
    }

    await this.programQuestionRepository.save(programQuestion);
    return programQuestion;
  }

  public async changePhase(
    programId: number,
    newPhase: ProgramPhase,
  ): Promise<SimpleProgramRO> {
    const oldPhase = (await this.programRepository.findOne(programId)).phase;
    await this.changeProgramValue(programId, {
      phase: newPhase,
    });
    const changedProgram = await this.findOne(programId);
    if (
      oldPhase === ProgramPhase.design &&
      newPhase === ProgramPhase.registrationValidation
    ) {
      await this.publish(programId);
    }
    return this.buildProgramRO(changedProgram);
  }

  public async publish(programId: number): Promise<SimpleProgramRO> {
    const selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == true) {
      const errors = { Program: ' already published' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    await this.changeProgramValue(programId, { published: true });

    const changedProgram = await this.findOne(programId);
    return await this.buildProgramRO(changedProgram);
  }

  public async unpublish(programId: number): Promise<SimpleProgramRO> {
    let selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == false) {
      const errors = { Program: ' already unpublished' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    await this.changeProgramValue(programId, { published: false });
    return await this.buildProgramRO(selectedProgram);
  }

  private async changeProgramValue(
    programId: number,
    change: object,
  ): Promise<void> {
    await getRepository(ProgramEntity)
      .createQueryBuilder()
      .update(ProgramEntity)
      .set(change)
      .where('id = :id', { id: programId })
      .execute();
  }

  private buildProgramRO(program: ProgramEntity): SimpleProgramRO {
    const simpleProgramRO = {
      id: program.id,
      title: program.title,
      phase: program.phase,
    };

    return simpleProgramRO;
  }

  private async getRegistrationByReferenceId(
    referenceId: string,
  ): Promise<RegistrationEntity> {
    return await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
    });
  }

  private async getRegistrationByReferenceIdOrThrow(
    referenceId: string,
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationByReferenceId(referenceId);
    if (!registration) {
      const errors = 'No registration found for PA.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return registration;
  }

  public async getInclusionStatus(
    programId: number,
    referenceId: string,
  ): Promise<InclusionStatus> {
    let registration = await this.getRegistrationByReferenceIdOrThrow(
      referenceId,
    );

    await this.checkIfProgramExists(programId);

    let inclusionStatus: InclusionStatus;

    if (registration.registrationStatus === RegistrationStatusEnum.included) {
      inclusionStatus = { status: PaStatus.included };
    } else if (
      registration.registrationStatus === RegistrationStatusEnum.rejected
    ) {
      inclusionStatus = { status: PaStatus.rejected };
    } else {
      inclusionStatus = { status: 'unavailable' };
    }

    return inclusionStatus;
  }

  private async getIncludedRegistrations(
    programId: number,
  ): Promise<RegistrationEntity[]> {
    return await this.registrationRepository.find({
      where: {
        program: { id: programId },
        registrationStatus: RegistrationStatusEnum.included,
      },
      relations: ['fsp'],
    });
  }

  public async getTotalIncluded(programId: number): Promise<TotalIncluded> {
    const includedRegistrations = await this.getIncludedRegistrations(
      programId,
    );
    const sum = includedRegistrations.reduce(function(a, b) {
      return a + (b[Attributes.paymentAmountMultiplier] || 1);
    }, 0);
    return {
      connections: includedRegistrations.length,
      transferAmounts: sum,
    };
  }

  private async getRegistrationsForPayment(
    programId: number,
    installment: number,
    referenceId?: string,
  ): Promise<RegistrationEntity[]> {
    const knownInstallment = await this.transactionRepository.findOne({
      where: { installment: installment },
    });
    let failedRegistrations;
    if (knownInstallment) {
      const failedReferenceIds = (
        await this.getFailedTransactions(programId, installment)
      ).map(t => t.referenceId);
      failedRegistrations = await this.registrationRepository.find({
        where: { referenceId: In(failedReferenceIds) },
        relations: ['fsp'],
      });
    }

    // If 'referenceId' is passed (only in retry-payment-per PA) use this PA only,
    // If known installment, then only failed connections
    // otherwise (new payment) get all included PA's
    return referenceId
      ? await this.registrationRepository.find({
          where: { referenceId: referenceId },
          relations: ['fsp'],
        })
      : knownInstallment
      ? failedRegistrations
      : await this.getIncludedRegistrations(programId);
  }

  public async payout(
    userId: number,
    programId: number,
    installment: number,
    amount: number,
    referenceId?: string,
  ): Promise<number> {
    let program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    if (!program || program.phase === 'design') {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const targetedRegistrations = await this.getRegistrationsForPayment(
      programId,
      installment,
      referenceId,
    );

    if (targetedRegistrations.length < 1) {
      const errors = 'There are no targeted PAs for this payment';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const paPaymentDataList = await this.createPaPaymentDataList(
      targetedRegistrations,
    );

    await this.actionService.saveAction(
      userId,
      programId,
      installment === -1
        ? AdditionalActionType.testMpesaPayment
        : AdditionalActionType.paymentStarted,
    );

    const paymentTransactionResult = await this.fspService.payout(
      paPaymentDataList,
      programId,
      installment,
      amount,
      userId,
    );
    console.log('paymentTransactionResult: ', paymentTransactionResult);

    return paymentTransactionResult;
  }

  private async createPaPaymentDataList(
    includedRegistrations: RegistrationEntity[],
  ): Promise<PaPaymentDataDto[]> {
    let paPaymentDataList = [];
    for (let includedRegistration of includedRegistrations) {
      const paPaymentData = new PaPaymentDataDto();
      paPaymentData.referenceId = includedRegistration.referenceId;
      const fsp = await this.fspService.getFspById(includedRegistration.fsp.id);
      // NOTE: this is ugly, but spent too much time already on how to automate this..
      if (fsp.fsp === fspName.intersolve) {
        paPaymentData.fspName = fspName.intersolve;
      } else if (fsp.fsp === fspName.intersolveNoWhatsapp) {
        paPaymentData.fspName = fspName.intersolveNoWhatsapp;
      } else if (fsp.fsp === fspName.africasTalking) {
        paPaymentData.fspName = fspName.africasTalking;
      }
      paPaymentData.paymentAddress = await this.getPaymentAddress(
        includedRegistration,
        fsp.attributes,
      );
      paPaymentData.paymentAmountMultiplier =
        includedRegistration.paymentAmountMultiplier;

      paPaymentDataList.push(paPaymentData);
    }
    return paPaymentDataList;
  }

  private async getPaymentAddress(
    includedRegistration: RegistrationEntity,
    fspAttributes: FspAttributeEntity[],
  ): Promise<null | string> {
    for (let attribute of fspAttributes) {
      // NOTE: this is still not ideal, as it is hard-coded. No other quick solution was found.
      if (
        attribute.name === CustomDataAttributes.phoneNumber ||
        attribute.name === CustomDataAttributes.whatsappPhoneNumber
      ) {
        const paymentAddressColumn = attribute.name;
        return includedRegistration.customData[paymentAddressColumn];
      }
    }
    return null;
  }

  private getName(customData): string {
    if (customData[CustomDataAttributes.name]) {
      return customData[CustomDataAttributes.name];
    } else if (customData[CustomDataAttributes.firstName]) {
      return (
        customData[CustomDataAttributes.firstName] +
        (customData[CustomDataAttributes.secondName]
          ? ' ' + customData[CustomDataAttributes.secondName]
          : '') +
        (customData[CustomDataAttributes.thirdName]
          ? ' ' + customData[CustomDataAttributes.thirdName]
          : '')
      );
    } else if (customData[CustomDataAttributes.nameFirst]) {
      return (
        customData[CustomDataAttributes.nameFirst] +
        (customData[CustomDataAttributes.nameLast]
          ? ' ' + customData[CustomDataAttributes.nameLast]
          : '')
      );
    } else {
      return '';
    }
  }

  public async getInstallments(
    programId: number,
  ): Promise<
    {
      installment: number;
      installmentDate: Date | string;
      amount: number;
    }[]
  > {
    const installments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('installment')
      .addSelect('MIN(transaction.created)', 'installmentDate')
      .addSelect(
        'MIN(transaction.amount / coalesce(r.paymentAmountMultiplier, 1) )',
        'amount',
      )
      .leftJoin('transaction.registration', 'r')
      .where('transaction.program.id = :programId', { programId: programId })
      .groupBy('installment')
      .getRawMany();
    return installments;
  }

  public async getTransactions(
    programId: number,
    minInstallment?: number,
  ): Promise<any> {
    const maxAttemptPerPaAndInstallment = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(['installment', '"registrationId"'])
      .addSelect(
        `MAX(cast("transactionStep" as varchar) || '-' || cast(created as varchar)) AS max_attempt`,
      )
      .groupBy('installment')
      .addGroupBy('"registrationId"');

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.created AS "installmentDate"',
        'transaction.installment AS installment',
        '"referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as error',
        'transaction.customData as "customData"',
      ])
      .leftJoin(
        '(' + maxAttemptPerPaAndInstallment.getQuery() + ')',
        'subquery',
        `transaction.registrationId = subquery."registrationId" AND transaction.installment = subquery.installment AND cast("transactionStep" as varchar) || '-' || cast(created as varchar) = subquery.max_attempt`,
      )
      .leftJoin('transaction.registration', 'r')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.installment >= :minInstallment', {
        minInstallment: minInstallment || 0,
      })
      .andWhere('subquery.max_attempt IS NOT NULL')
      .getRawMany();
    return transactions;
  }

  public async getFailedTransactions(
    programId: number,
    installment: number,
  ): Promise<any> {
    const allLatestTransactionAttemptsPerPa = await this.getTransactions(
      programId,
      installment,
    );
    const failedTransactions = allLatestTransactionAttemptsPerPa.filter(
      t => t.installment === installment && t.status === StatusEnum.error,
    );
    return failedTransactions;
  }

  public async getTransaction(
    input: GetTransactionDto,
  ): Promise<GetTransactionOutputDto> {
    const registration = await this.getRegistrationByReferenceId(
      input.referenceId,
    );

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.created AS "installmentDate"',
        'installment',
        '"referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as error',
        'transaction.customData as "customData"',
      ])
      .leftJoin('transaction.registration', 'c')
      .where('transaction.program.id = :programId', {
        programId: input.programId,
      })
      .andWhere('transaction.installment = :installmentId', {
        installmentId: input.installment,
      })
      .andWhere('transaction.registration.id = :registrationId', {
        registrationId: registration.id,
      })
      .orderBy('transaction.created', 'DESC')
      .getRawMany();
    if (transactions.length === 0) {
      return null;
    }
    if (input.customDataKey) {
      for (const transaction of transactions) {
        if (
          transaction.customData[input.customDataKey] === input.customDataValue
        ) {
          return transaction;
        }
      }
      return null;
    }
    for (const transaction of transactions) {
      if (
        !transaction.customData ||
        Object.keys(transaction.customData).length === 0
      ) {
        return transaction;
      }
    }
  }

  public async getInstallmentsWithStateSums(
    programId: number,
  ): Promise<InstallmentStateSumDto[]> {
    const totalProcessedInstallments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MAX(transaction.installment)')
      .getRawOne();
    const program = await this.programRepository.findOne(programId);
    const installmentNrSearch = Math.max(
      ...[totalProcessedInstallments.max, program.distributionDuration],
    );
    const installmentsWithStats = [];
    let i = 1;
    const transactionStepMin = await await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MIN(transaction.transactionStep)')
      .getRawOne();
    while (i < installmentNrSearch) {
      const result = await this.getOneInstallmentWithStateSum(
        programId,
        i,
        transactionStepMin.min,
      );
      installmentsWithStats.push(result);
      i++;
    }
    return installmentsWithStats;
  }

  public async getOneInstallmentWithStateSum(
    programId: number,
    installment: number,
    transactionStepOfInterest: number,
  ): Promise<InstallmentStateSumDto> {
    const currentInstallmentRegistrationsAndCount = await this.transactionRepository.findAndCount(
      {
        where: {
          program: { id: programId },
          status: StatusEnum.success,
          installment: installment,
          transactionStep: transactionStepOfInterest,
        },
        relations: ['registration'],
      },
    );
    const currentInstallmentRegistrations =
      currentInstallmentRegistrationsAndCount[0];
    const currentInstallmentCount = currentInstallmentRegistrationsAndCount[1];
    const currentInstallmentRegistrationsIds = currentInstallmentRegistrations.map(
      ({ registration }) => registration.id,
    );
    let preExistingPa: number;
    if (currentInstallmentCount > 0) {
      preExistingPa = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.registration', 'registration')
        .where('transaction.registration.id IN (:...registrationIds)', {
          registrationIds: currentInstallmentRegistrationsIds,
        })
        .andWhere('transaction.installment = :installment', {
          installment: installment - 1,
        })
        .andWhere('transaction.status = :status', {
          status: StatusEnum.success,
        })
        .andWhere('transaction.transactionStep = :transactionStep', {
          transactionStep: transactionStepOfInterest,
        })
        .andWhere('transaction.programId = :programId', {
          programId: programId,
        })
        .getCount();
    } else {
      preExistingPa = 0;
    }
    return {
      id: installment,
      values: {
        'pre-existing': preExistingPa,
        new: currentInstallmentCount - preExistingPa,
      },
    };
  }
}
