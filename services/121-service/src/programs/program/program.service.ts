import { GetTransactionDto } from './dto/get-transaction.dto';
import { ActionService } from './../../actions/action.service';
import { PaMetrics } from './dto/pa-metrics.dto';
import { TransactionEntity } from './transactions.entity';
import { ConnectionEntity } from '../../connection/connection.entity';
import { CustomCriterium } from './custom-criterium.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { ProgramPhase } from '../../models/program-phase.model';
import { PaStatus, PaStatusTimestampField } from '../../models/pa-status.model';
import { UserEntity } from '../../user/user.entity';
import { CreateProgramDto } from './dto';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
import { InclusionStatus } from './dto/inclusion-status.dto';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { SmsService } from '../../notifications/sms/sms.service';
import {
  FinancialServiceProviderEntity,
  fspName,
} from '../fsp/financial-service-provider.entity';
import { ExportType } from './dto/export-details';
import {
  ActionEntity,
  AdditionalActionType,
} from '../../actions/action.entity';
import { FspService } from '../fsp/fsp.service';
import { UpdateCustomCriteriumDto } from './dto/update-custom-criterium.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { PaPaymentDataDto } from '../fsp/dto/pa-payment-data.dto';
import { PaymentTransactionResultDto } from '../fsp/dto/payment-transaction-result.dto';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { StatusEnum } from '../../shared/enum/status.enum';
import { CriteriumForExport } from './dto/criterium-for-export.dto';
import { FileDto } from './dto/file.dto';
import { LookupService } from '../../notifications/lookup/lookup.service';
import { CustomDataAttributes } from '../../connection/validation-data/dto/custom-data-attributes';
import { Attributes } from '../../connection/dto/update-attribute.dto';
import { TotalIncluded } from './dto/payout.dto';

@Injectable()
export class ProgramService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(CustomCriterium)
  public customCriteriumRepository: Repository<CustomCriterium>;
  @InjectRepository(FspAttributeEntity)
  public fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  @InjectRepository(ProtectionServiceProviderEntity)
  public protectionServiceProviderRepository: Repository<
    ProtectionServiceProviderEntity
  >;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;

  public constructor(
    private readonly actionService: ActionService,
    private readonly smsService: SmsService,
    private readonly fspService: FspService,
    private readonly lookupService: LookupService,
  ) {}

  private async checkIfProgramExists(programId: number): Promise<void> {
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = `Program with ID "${programId}" not found.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
  }

  public async findOne(where): Promise<ProgramEntity> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .addOrderBy('customCriterium.id', 'ASC')
      .leftJoinAndSelect('program.aidworkers', 'aidworker')
      .leftJoinAndSelect(
        'program.financialServiceProviders',
        'financialServiceProvider',
      )
      .leftJoinAndSelect(
        'program.protectionServiceProviders',
        'protectionServiceProvider',
      );

    qb.whereInIds([where]);
    const program = qb.getOne();
    return program;
  }

  public async findAll(): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .addOrderBy('customCriterium.id', 'ASC');

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
    program.customCriteria = [];
    program.financialServiceProviders = [];
    program.protectionServiceProviders = [];

    const author = await this.userRepository.findOne(userId);
    program.author = author;

    for (let customCriterium of programData.customCriteria) {
      let customReturn = await this.customCriteriumRepository.save(
        customCriterium,
      );
      program.customCriteria.push(customReturn);
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
    for (let item of programData.protectionServiceProviders) {
      let psp = await this.protectionServiceProviderRepository.findOne({
        relations: ['program'],
        where: { id: item.id },
      });
      if (!psp) {
        const errors = `No psp found with id ${item.id}`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      psp.program.push(program);
      await this.protectionServiceProviderRepository.save(psp);
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

  public async updateCustomCriterium(
    updateCustomCriteriumDto: UpdateCustomCriteriumDto,
  ): Promise<CustomCriterium> {
    const criterium = await this.customCriteriumRepository.findOne({
      where: { criterium: updateCustomCriteriumDto.criterium },
    });
    if (!criterium) {
      const errors = `No criterium found with name ${updateCustomCriteriumDto.criterium}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let attribute in updateCustomCriteriumDto) {
      if (attribute !== 'criterium') {
        criterium[attribute] = updateCustomCriteriumDto[attribute];
      }
    }

    await this.customCriteriumRepository.save(criterium);
    return criterium;
  }

  public async delete(programId: number): Promise<DeleteResult> {
    return await this.programRepository.delete(programId);
  }

  public async changeState(
    programId: number,
    newState: ProgramPhase,
  ): Promise<SimpleProgramRO> {
    const oldState = (await this.programRepository.findOne(programId)).state;
    await this.changeProgramValue(programId, {
      state: newState,
    });
    const changedProgram = await this.findOne(programId);
    if (
      oldState === ProgramPhase.design &&
      newState === ProgramPhase.registrationValidation
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
      state: program.state,
    };

    return simpleProgramRO;
  }

  private async getConnectionByReferenceId(
    referenceId: string,
  ): Promise<ConnectionEntity> {
    return await this.connectionRepository.findOne({
      where: { referenceId: referenceId },
    });
  }

  private async getConnectionByReferenceIdOrThrow(
    referenceId: string,
  ): Promise<ConnectionEntity> {
    let connection = await this.getConnectionByReferenceId(referenceId);
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return connection;
  }

  private async sendSmsMessage(
    connection: ConnectionEntity,
    programId: number,
    message?: string,
  ): Promise<void> {
    this.smsService.notifyBySms(
      connection.phoneNumber,
      connection.preferredLanguage,
      programId,
      message,
      null,
    );
  }

  public async getInclusionStatus(
    programId: number,
    referenceId: string,
  ): Promise<InclusionStatus> {
    let connection = await this.getConnectionByReferenceIdOrThrow(referenceId);

    await this.checkIfProgramExists(programId);

    let inclusionStatus: InclusionStatus;

    if (connection.programsIncluded.includes(+programId)) {
      inclusionStatus = { status: PaStatus.included };
    } else if (connection.programsRejected.includes(+programId)) {
      inclusionStatus = { status: PaStatus.rejected };
    } else {
      inclusionStatus = { status: 'unavailable' };
    }

    return inclusionStatus;
  }

  public async setPaStatusTimestampField(
    programId: number,
    referenceIds: object,
    timestampField: PaStatusTimestampField,
  ): Promise<void> {
    await this.checkIfProgramExists(programId);

    for (let referenceId of JSON.parse(referenceIds['referenceIds'])) {
      let connection = await this.getConnectionByReferenceId(
        referenceId.referenceId,
      );
      if (!connection) continue;

      connection[timestampField] = new Date();

      await this.connectionRepository.save(connection);
    }
  }

  public async invite(
    programId: number,
    phoneNumbers: string,
    message?: string,
  ): Promise<void> {
    await this.checkIfProgramExists(programId);

    for (let phoneNumber of JSON.parse(phoneNumbers['phoneNumbers'])) {
      const sanitizedPhoneNr = await this.lookupService.lookupAndCorrect(
        phoneNumber,
      );
      let connection = await this.connectionRepository.findOne({
        where: { phoneNumber: sanitizedPhoneNr },
      });
      if (!connection) continue;

      connection.invitedDate = new Date();

      await this.connectionRepository.save(connection);

      if (message) {
        this.sendSmsMessage(connection, programId, message);
      }
    }
  }

  public async include(
    programId: number,
    referenceIds: object,
    message?: string,
  ): Promise<void> {
    await this.checkIfProgramExists(programId);

    for (let referenceId of JSON.parse(referenceIds['referenceIds'])) {
      let connection = await this.getConnectionByReferenceId(
        referenceId.referenceId,
      );
      if (!connection) continue;

      // Add to inclusion-array, if not yet present
      const indexIn = connection.programsIncluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexIn <= -1) {
        connection.programsIncluded.push(programId);
        if (message) {
          this.sendSmsMessage(connection, programId, message);
        }
      }
      // Remove from rejection-array, if present
      const indexEx = connection.programsRejected.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexEx > -1) {
        connection.programsRejected.splice(indexEx, 1);
      }

      connection.inclusionDate = new Date();

      await this.connectionRepository.save(connection);
    }
  }

  public async end(
    programId: number,
    referenceIds: object,
    message?: string,
  ): Promise<void> {
    await this.checkIfProgramExists(programId);

    for (let referenceId of JSON.parse(referenceIds['referenceIds'])) {
      let connection = await this.getConnectionByReferenceId(
        referenceId.referenceId,
      );
      if (!connection) continue;

      // Add to rejection-array, if not yet present
      const indexEx = connection.programsRejected.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexEx <= -1) {
        connection.programsRejected.push(programId);
        if (message) {
          this.sendSmsMessage(connection, programId, message);
        }
      }
      // Remove from inclusion-array, if present
      const indexIn = connection.programsIncluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexIn > -1) {
        connection.programsIncluded.splice(indexIn, 1);
      }

      connection.inclusionEndDate = new Date();

      await this.connectionRepository.save(connection);
    }
  }

  public async reject(
    programId: number,
    referenceIds: object,
    message?: string,
  ): Promise<void> {
    await this.checkIfProgramExists(programId);

    for (let referenceId of JSON.parse(referenceIds['referenceIds'])) {
      let connection = await this.getConnectionByReferenceId(
        referenceId.referenceId,
      );
      if (!connection) continue;

      // Add to rejection-array, if not yet present
      const indexEx = connection.programsRejected.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexEx <= -1) {
        connection.programsRejected.push(programId);
        if (message) {
          this.sendSmsMessage(connection, programId, message);
        }
      }
      // Remove from inclusion-array, if present
      const indexIn = connection.programsIncluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexIn > -1) {
        connection.programsIncluded.splice(indexIn, 1);
      }

      connection.rejectionDate = new Date();

      await this.connectionRepository.save(connection);
    }
  }

  private async getIncludedConnections(
    programId: number,
  ): Promise<ConnectionEntity[]> {
    const connections = await this.connectionRepository.find({
      relations: ['fsp'],
    });
    const includedConnections = [];
    for (let connection of connections) {
      if (connection.programsIncluded.includes(+programId)) {
        includedConnections.push(connection);
      }
    }
    return includedConnections;
  }

  public async getTotalIncluded(programId: number): Promise<TotalIncluded> {
    const includedConnections = await this.getIncludedConnections(programId);
    const sum = includedConnections.reduce(function(a, b) {
      return a + (b[Attributes.paymentAmountMultiplier] || 1);
    }, 0);
    return {
      connections: includedConnections.length,
      transferAmounts: sum,
    };
  }

  public async payout(
    userId: number,
    programId: number,
    installment: number,
    amount: number,
    referenceId?: string,
  ): Promise<PaymentTransactionResultDto> {
    let program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    if (!program || program.state === 'design') {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // If 'referenceId' is passed (only in retry-payment-per PA) use this PA only, otherwise get all included PA's
    const includedConnections = referenceId
      ? await this.connectionRepository.find({
          where: { referenceId: referenceId },
          relations: ['fsp'],
        })
      : await this.getIncludedConnections(programId);
    if (includedConnections.length < 1) {
      const errors = 'There are no included PA for this program';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const paPaymentDataList = await this.createPaPaymentDataList(
      includedConnections,
    );

    const paymentTransactionResult = await this.fspService.payout(
      paPaymentDataList,
      programId,
      installment,
      amount,
    );

    if (installment === -1) {
      this.actionService.saveAction(
        userId,
        programId,
        AdditionalActionType.testMpesaPayment,
      );
    }

    return paymentTransactionResult;
  }

  private async createPaPaymentDataList(
    includedConnections: ConnectionEntity[],
  ): Promise<PaPaymentDataDto[]> {
    let paPaymentDataList = [];
    for (let includedConnection of includedConnections) {
      const paPaymentData = new PaPaymentDataDto();
      paPaymentData.referenceId = includedConnection.referenceId;
      const fsp = await this.fspService.getFspById(includedConnection.fsp.id);
      // NOTE: this is ugly, but spent too much time already on how to automate this..
      if (fsp.fsp === fspName.intersolve) {
        paPaymentData.fspName = fspName.intersolve;
      } else if (fsp.fsp === fspName.intersolveNoWhatsapp) {
        paPaymentData.fspName = fspName.intersolveNoWhatsapp;
      } else if (fsp.fsp === fspName.africasTalking) {
        paPaymentData.fspName = fspName.africasTalking;
      }
      paPaymentData.paymentAddress = await this.getPaymentAddress(
        includedConnection,
        fsp.attributes,
      );
      paPaymentData.paymentAmountMultiplier =
        includedConnection.paymentAmountMultiplier;

      paPaymentDataList.push(paPaymentData);
    }
    return paPaymentDataList;
  }

  private async getPaymentAddress(
    includedConnection: ConnectionEntity,
    fspAttributes: FspAttributeEntity[],
  ): Promise<null | string> {
    for (let attribute of fspAttributes) {
      // NOTE: this is still not ideal, as it is hard-coded. No other quick solution was found.
      if (
        attribute.name === CustomDataAttributes.phoneNumber ||
        attribute.name === CustomDataAttributes.whatsappPhoneNumber
      ) {
        const paymentAddressColumn = attribute.name;
        return includedConnection.customData[paymentAddressColumn];
      }
    }
    return null;
  }

  private getPaStatus(
    connection: ConnectionEntity,
    programId: number,
  ): PaStatus {
    let paStatus: PaStatus;
    if (connection.programsIncluded.includes(+programId)) {
      paStatus = PaStatus.included;
    } else if (connection.inclusionEndDate) {
      paStatus = PaStatus.inclusionEnded;
    } else if (connection.programsRejected.includes(+programId)) {
      paStatus = PaStatus.rejected;
    } else if (connection.appliedDate && connection.noLongerEligibleDate) {
      paStatus = PaStatus.registeredWhileNoLongerEligible;
    } else if (connection.validationDate) {
      paStatus = PaStatus.validated;
    } else if (connection.selectedForValidationDate) {
      paStatus = PaStatus.selectedForValidation;
    } else if (connection.appliedDate) {
      paStatus = PaStatus.registered;
    } else if (connection.accountCreatedDate) {
      paStatus = PaStatus.created;
    } else if (connection.noLongerEligibleDate) {
      paStatus = PaStatus.noLongerEligible;
    } else if (connection.invitedDate) {
      paStatus = PaStatus.invited;
    } else if (connection.importedDate) {
      paStatus = PaStatus.imported;
    } else if (connection.created) {
      paStatus = PaStatus.created;
    }
    return paStatus;
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

  public async getConnections(
    programId: number,
    privacy: boolean,
  ): Promise<any[]> {
    const selectedConnections = await this.getAllConnections(programId);

    const financialServiceProviders = (
      await this.findOne(+programId)
    ).financialServiceProviders.map(fsp => fsp.fsp);

    const connectionsResponse = [];
    for (let connection of selectedConnections) {
      const connectionResponse = {};
      connectionResponse['id'] = connection.id;
      connectionResponse['referenceId'] = connection.referenceId;
      connectionResponse['inclusionScore'] = connection.inclusionScore;
      connectionResponse['created'] = connection.accountCreatedDate;
      connectionResponse['importedDate'] = connection.importedDate;
      connectionResponse['invitedDate'] = connection.invitedDate;
      connectionResponse['noLongerEligibleDate'] =
        connection.noLongerEligibleDate;
      connectionResponse['appliedDate'] = connection.appliedDate;
      connectionResponse['selectedForValidationDate'] =
        connection.selectedForValidationDate;
      connectionResponse['validationDate'] = connection.validationDate;
      connectionResponse['inclusionDate'] = connection.inclusionDate;
      connectionResponse['inclusionEndDate'] = connection.inclusionEndDate;
      connectionResponse['rejectionDate'] = connection.rejectionDate;
      connectionResponse['fsp'] = connection.fsp?.fsp;
      connectionResponse['namePartnerOrganization'] =
        connection.namePartnerOrganization;
      connectionResponse['status'] = this.getPaStatus(connection, +programId);

      if (privacy) {
        connectionResponse['name'] = this.getName(connection.customData);
        connectionResponse['phoneNumber'] =
          connection.phoneNumber ||
          connection.customData[CustomDataAttributes.phoneNumber];
        connectionResponse['whatsappPhoneNumber'] =
          connection.customData[CustomDataAttributes.whatsappPhoneNumber];
        connectionResponse['location'] = connection.customData['location'];
        connectionResponse['vnumber'] = connection.customData['vnumber'];
        connectionResponse['age'] = connection.customData['age'];
        connectionResponse['paymentAmountMultiplier'] =
          connection.paymentAmountMultiplier;
      }

      if (financialServiceProviders.includes(fspName.africasTalking)) {
        connectionResponse['phonenumberTestResult'] = await this.getMpesaStatus(
          connection.id,
          +programId,
        );
      }

      connectionsResponse.push(connectionResponse);
    }
    return connectionsResponse;
  }

  private async getMpesaStatus(
    connectionId: number,
    programId: number,
  ): Promise<string> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        connection: { id: connectionId },
        program: { id: programId },
        installment: -1,
      },
      order: {
        created: 'DESC',
      },
    });
    if (!transaction) {
      return null;
    } else if (
      transaction.errorMessage === 'Value is outside the allowed limits'
    ) {
      return 'Success: Valid M-PESA number';
    } else if (transaction.errorMessage === 'Missing recipient name') {
      return 'Error: No M-PESA number';
    } else {
      return 'Other error: ' + transaction.errorMessage;
    }
  }

  private async getAllConnections(programId): Promise<ConnectionEntity[]> {
    const connections = await this.connectionRepository.find({
      relations: ['fsp'],
      order: { inclusionScore: 'DESC' },
    });
    const enrolledConnections = [];
    for (let connection of connections) {
      if (
        connection.programsApplied.includes(+programId) || // Get connections applied to your program ..
        connection.programsApplied.length === 0 // .. and connections applied to no program (so excluding connections applied to other program)
      ) {
        enrolledConnections.push(connection);
      }
    }
    return enrolledConnections;
  }

  public async getMonitoringData(programId: number): Promise<any[]> {
    const connections = await this.getAllConnections(+programId);

    return connections.map(connection => {
      const appliedDate = new Date(connection.appliedDate).getTime();
      const startDate = new Date(connection.created).getTime();
      const durationSeconds = (appliedDate - startDate) / 1000;
      return {
        monitoringAnswer: connection.customData['monitoringAnswer'],
        registrationDuration: durationSeconds,
        status: this.getPaStatus(connection, programId),
      };
    });
  }

  public async getInstallments(programId: number): Promise<any> {
    const installments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('installment')
      .addSelect('MIN(transaction.created)', 'installmentDate')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere("transaction.status = 'success'")
      .groupBy('installment')
      .getRawMany();
    return installments;
  }

  public async getTransactions(
    programId: number,
    minInstallment?: number,
  ): Promise<any> {
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
      .leftJoin('transaction.connection', 'c')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('installment >= :minInstallment', {
        minInstallment: minInstallment || 0,
      })
      .orderBy('transaction.transactionStep', 'DESC')
      .getRawMany();
    return transactions;
  }

  public async getTransaction(
    input: GetTransactionDto,
  ): Promise<TransactionEntity> {
    const connection = await this.getConnectionByReferenceId(input.referenceId);

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
      .leftJoin('transaction.connection', 'c')
      .where('transaction.program.id = :programId', {
        programId: input.programId,
      })
      .andWhere('transaction.installment = :installmentId', {
        installmentId: input.installment,
      })
      .andWhere('transaction.connection.id = :connectionId', {
        connectionId: connection.id,
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

  public async getPaymentDetails(
    programId: number,
    installmentId: number,
  ): Promise<FileDto> {
    let pastPaymentDetails = await this.getPaymentDetailsInstallment(
      programId,
      installmentId,
    );

    if (pastPaymentDetails.length === 0) {
      return {
        fileName: `payment-details-future-installment-${installmentId}.csv`,
        data: (await this.getInclusionList(programId)).data,
      };
    }

    pastPaymentDetails = await this.filterAttributesToExport(
      pastPaymentDetails,
    );

    const csvFile = {
      fileName: `payment-details-completed-installment-${installmentId}.csv`,
      data: this.jsonToCsv(pastPaymentDetails),
    };

    return csvFile;
  }

  private async filterAttributesToExport(pastPaymentDetails): Promise<any[]> {
    const criteria = (await this.getAllCriteriaForExport()).map(c => c.name);
    const outputPaymentDetails = [];
    pastPaymentDetails.forEach(transaction => {
      Object.keys(transaction.connection_customData).forEach(key => {
        if (criteria.includes(key)) {
          transaction[key] = transaction.connection_customData[key];
        }
      });
      delete transaction.connection_customData;
      outputPaymentDetails.push(transaction);
    });
    return outputPaymentDetails;
  }

  public async getUnusedVouchers(): Promise<FileDto> {
    const unusedVouchers = await this.fspService.getUnusedVouchers();
    unusedVouchers.forEach(v => {
      v.name = this.getName(v.customData);
      delete v.customData;
    });

    const response = {
      fileName: this.getExportFileName(ExportType.unusedVouchers),
      data: this.jsonToCsv(unusedVouchers),
    };

    return response;
  }

  public getExportList(
    programId: number,
    type: ExportType,
    installment: number | null = null,
    userId: number,
  ): Promise<FileDto> {
    this.actionService.saveAction(userId, programId, type);
    switch (type) {
      case ExportType.allPeopleAffected: {
        return this.getAllPeopleAffectedList(programId);
      }
      case ExportType.included: {
        return this.getInclusionList(programId);
      }
      case ExportType.selectedForValidation: {
        return this.getSelectedForValidationList(programId);
      }
      case ExportType.payment: {
        return this.getPaymentDetails(programId, installment);
      }
      case ExportType.unusedVouchers: {
        return this.getUnusedVouchers();
      }
    }
  }

  private addGenericFieldsToExport(
    row: object,
    connection: ConnectionEntity,
    programId: number,
  ): object {
    const dateFields = [
      'created',
      'appliedDate',
      'selectedForValidationDate',
      'validationDate',
      'inclusionDate',
      'inclusionEndDate',
      'rejectionDate',
    ];
    dateFields.forEach(field => {
      row[field] = connection[field];
    });

    row['status'] = this.getPaStatus(connection, programId);
    row['financialServiceProvider'] = connection.fsp?.fsp;

    return row;
  }

  private addCustomCriteriaToExport(
    row: object,
    criteria: any[],
    connection: ConnectionEntity,
    exportType: ExportType,
  ): object {
    criteria.forEach(criterium => {
      if (criterium.export && criterium.export.includes(exportType)) {
        row[criterium.name] = connection.customData[criterium.name];
      }
    });
    return row;
  }

  private async getAllCriteriaForExport(): Promise<CriteriumForExport[]> {
    return (await this.customCriteriumRepository.find())
      .map(c => {
        return {
          name: c.criterium,
          export: JSON.parse(JSON.stringify(c.export)),
        };
      })
      .concat(
        (await this.fspAttributeRepository.find()).map(c => {
          return {
            name: c.name,
            export: JSON.parse(JSON.stringify(c.export)),
          };
        }),
      );
  }

  private async getAllPeopleAffectedList(programId: number): Promise<FileDto> {
    const connections = await this.connectionRepository.find({
      relations: ['fsp'],
    });
    const criteria = await this.getAllCriteriaForExport();

    const connectionDetails = [];
    connections.forEach(connection => {
      let row = {};
      row = this.addCustomCriteriaToExport(
        row,
        criteria,
        connection,
        ExportType.allPeopleAffected,
      );
      row = this.addGenericFieldsToExport(row, connection, programId);
      connectionDetails.push(row);
    });
    const filteredColumnDetails = this.filterUnusedColumn(connectionDetails);
    const response = {
      fileName: this.getExportFileName(ExportType.allPeopleAffected),
      data: this.jsonToCsv(filteredColumnDetails),
    };

    return response;
  }

  private async getInclusionList(programId: number): Promise<FileDto> {
    const includedConnections = (
      await this.connectionRepository.find({ relations: ['fsp'] })
    ).filter(
      connection =>
        this.getPaStatus(connection, programId) === PaStatus.included,
    );

    const criteria = await this.getAllCriteriaForExport();

    const inclusionDetails = [];
    includedConnections.forEach(connection => {
      let row = {};
      row = this.addCustomCriteriaToExport(
        row,
        criteria,
        connection,
        ExportType.included,
      );
      row = this.addGenericFieldsToExport(row, connection, programId);
      // row['phonenumberTestResult'] = this.getMpesaStatus(
      //   connection.id,
      //   programId,
      // );
      inclusionDetails.push(row);
    });
    const filteredColumnDetails = this.filterUnusedColumn(inclusionDetails);
    const response = {
      fileName: this.getExportFileName('inclusion-list'),
      data: this.jsonToCsv(filteredColumnDetails),
    };

    return response;
  }

  private async getSelectedForValidationList(
    programId: number,
  ): Promise<FileDto> {
    const selectedConnections = (
      await this.connectionRepository.find({ relations: ['fsp'] })
    ).filter(
      connection =>
        this.getPaStatus(connection, programId) ===
        PaStatus.selectedForValidation,
    );

    const criteria = await this.getAllCriteriaForExport();

    const columnDetails = [];
    selectedConnections.forEach(connection => {
      let row = {};
      row = this.addCustomCriteriaToExport(
        row,
        criteria,
        connection,
        ExportType.selectedForValidation,
      );
      row = this.addGenericFieldsToExport(row, connection, programId);
      columnDetails.push(row);
    });

    const filteredColumnDetails = this.filterUnusedColumn(columnDetails);
    const response = {
      fileName: this.getExportFileName(ExportType.selectedForValidation),
      data: this.jsonToCsv(filteredColumnDetails),
    };

    return response;
  }

  public filterUnusedColumn(columnDetails): object[] {
    const emptyColumns = [];
    for (let row of columnDetails) {
      for (let key in row) {
        if (row[key]) {
          emptyColumns.push(key);
        }
      }
    }
    const filteredColumns = [];
    for (let row of columnDetails) {
      for (let key in row) {
        if (!emptyColumns.includes(key)) {
          delete row[key];
        }
      }
      filteredColumns.push(row);
    }
    return filteredColumns;
  }

  public async getPaymentDetailsInstallment(
    programId: number,
    installmentId: number,
  ): Promise<any> {
    const latestSuccessTransactionPerPa = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.connectionId', 'connectionId')
      .addSelect('MAX(transaction.created)', 'maxCreated')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.installment = :installmentId', {
        installmentId: installmentId,
      })
      .andWhere('transaction.status = :status', { status: StatusEnum.success })
      .groupBy('transaction.connectionId');

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.amount',
        'transaction.installment',
        'connection.phoneNumber',
        'connection.customData',
        'fsp.fsp AS financialServiceProvider',
      ])
      .innerJoin(
        '(' + latestSuccessTransactionPerPa.getQuery() + ')',
        'subquery',
        'transaction.connectionId = subquery."connectionId" AND transaction.created = subquery."maxCreated"',
      )
      .setParameters(latestSuccessTransactionPerPa.getParameters())
      .leftJoin('transaction.connection', 'connection')
      .leftJoin('connection.fsp', 'fsp')
      .getRawMany();

    return transactions;
  }

  public jsonToCsv(items: any[]): any[] | string {
    if (items.length === 0) {
      return '';
    }
    const cleanValues = (_key, value): any => (value === null ? '' : value);

    const columns = Object.keys(items[0]);

    let rows = items.map(row =>
      columns
        .map(fieldName => JSON.stringify(row[fieldName], cleanValues))
        .join(','),
    );

    rows.unshift(columns.join(',')); // Add header row

    return rows.join('\r\n');
  }

  private getExportFileName(base: string): string {
    return `${base}_${new Date().toISOString().substr(0, 10)}.csv`;
  }

  private filteredLength(connections, filterStatus: PaStatus): number {
    const filteredConnections = connections.filter(
      connection => connection.status === filterStatus,
    );
    return filteredConnections.length;
  }

  public async getPaMetrics(programId): Promise<PaMetrics> {
    const metrics = new PaMetrics();
    const connections = await this.getConnections(programId, false);

    metrics.included = this.filteredLength(connections, PaStatus.included);
    metrics.inclusionEnded = this.filteredLength(
      connections,
      PaStatus.inclusionEnded,
    );
    metrics.rejected = this.filteredLength(connections, PaStatus.rejected);
    metrics.verified =
      this.filteredLength(connections, PaStatus.validated) +
      metrics.included +
      metrics.inclusionEnded +
      metrics.rejected;
    metrics.finishedEnlisting =
      this.filteredLength(connections, PaStatus.registered) + metrics.verified;
    metrics.startedEnlisting =
      this.filteredLength(connections, PaStatus.created) +
      metrics.finishedEnlisting;

    return metrics;
  }
}
