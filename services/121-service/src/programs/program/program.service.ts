import { Length } from 'class-validator';
import { FundingOverview } from './../../funding/dto/funding-overview.dto';
import { FundingService } from './../../funding/funding.service';
import { TransactionEntity } from './transactions.entity';
import { VoiceService } from './../../notifications/voice/voice.service';
import { SchemaService } from './../../sovrin/schema/schema.service';
import { CredentialService } from './../../sovrin/credential/credential.service';
import { ProofService } from './../../sovrin/proof/proof.service';
import { ConnectionEntity } from './../../sovrin/create-connection/connection.entity';
import { CustomCriterium } from './custom-criterium.entity';
import {
  Injectable,
  HttpException,
  Inject,
  forwardRef,
  HttpService,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { ProgramEntity, ProgramPhase } from './program.entity';
import { UserEntity } from '../../user/user.entity';
import { CreateProgramDto } from './dto';

import { ProgramRO, ProgramsRO, SimpleProgramRO } from './program.interface';
import { InclusionStatus } from './dto/inclusion-status.dto';
import { InclusionRequestStatus } from './dto/inclusion-request-status.dto';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { SmsService } from '../../notifications/sms/sms.service';
import { API } from '../../config';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';

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

  public constructor(
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => CredentialService))
    private readonly credentialService: CredentialService,
    private readonly voiceService: VoiceService,
    @Inject(forwardRef(() => SmsService))
    private readonly smsService: SmsService,
    private readonly schemaService: SchemaService,
    @Inject(forwardRef(() => ProofService))
    private readonly proofService: ProofService,
    private readonly fundingService: FundingService,
  ) { }

  public async findOne(where): Promise<ProgramEntity> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .leftJoinAndSelect('program.aidworkers', 'aidworker')
      .leftJoinAndSelect(
        'program.financialServiceProviders',
        'financialServiceProvider',
      );

    qb.whereInIds([where]);
    const program = qb.getOne();
    return program;
  }

  public async findAll(query): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium');

    qb.where('1 = 1');

    if ('location' in query) {
      qb.andWhere('lower(program.location) LIKE :location', {
        location: `%${query.location.toLowerCase()}%`,
      });
    }

    if ('countryId' in query) {
      qb.andWhere('program.countryId = :countryId', {
        countryId: query.countryId,
      });
    }

    qb.orderBy('program.created', 'DESC');

    const programsCount = await qb.getCount();
    const programs = await qb.getMany();

    return { programs, programsCount };
  }

  public async findByCountry(query): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .where('"countryId" = :countryId', { countryId: query })
      .andWhere('published = true');

    const programsCount = await qb.getCount();
    const programs = await qb.getMany();
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
    program.description = programData.description;
    program.descLocation = programData.descLocation;
    program.descHumanitarianObjective = programData.descHumanitarianObjective;
    program.descCashType = programData.descCashType;
    program.countryId = programData.countryId;
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

  public async update(id: number, programData: any): Promise<ProgramRO> {
    let toUpdate = await this.programRepository.findOne({ id: id });
    let updated = Object.assign(toUpdate, programData);
    const program = await this.programRepository.save(updated);
    return { program };
  }

  public async delete(programId: number): Promise<DeleteResult> {
    return await this.programRepository.delete(programId);
  }

  public async changeState(programId: number, newState: string): Promise<SimpleProgramRO> {
    await this.changeProgramValue(programId, {
      state: newState,
    });
    const changedProgram = await this.findOne(programId);
    if (newState === ProgramPhase.registration) {
      await this.publish(programId);
    } else if (
      newState === ProgramPhase.inclusion ||      // This represents the real case of 'closing registration'
      newState === ProgramPhase.design            // This represents the (debug) case of moving back to design for some reason
    ) {
      await this.unpublish(programId);
    }
    return this.buildProgramRO(changedProgram);
  }


  public async publish(programId: number): Promise<SimpleProgramRO> {
    const selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == true) {
      const errors = { Program: ' already published' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    const result = await this.schemaService.create(selectedProgram);

    const credentialOffer = await this.credentialService.createOffer(
      result.credDefId,
    );

    const proofRequest = await this.proofService.createProofRequest(
      selectedProgram,
      result.credDefId,
    );

    await this.changeProgramValue(programId, {
      credOffer: credentialOffer,
    });
    await this.changeProgramValue(programId, { schemaId: result.schemaId });
    await this.changeProgramValue(programId, { credDefId: result.credDefId });
    await this.changeProgramValue(programId, {
      proofRequest: proofRequest,
    });
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
      state: program.state
    };

    return simpleProgramRO;
  }

  public async includeMe(
    programId: number,
    did: string,
    encryptedProof: string,
  ): Promise<InclusionRequestStatus> {
    `
    Verifier/HO gets schema_id/cred_def_id from ledger and validates proof.
    Inclusion algorithm is run. (Allocation algorithm as well?)
    Inclusion result is added to db (connectionRepository)?
    When done (time-loop): run getInclusionStatus from PA.
    `;
    const proof = encryptedProof; // this should actually be decrypted in a future scenario

    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    if (connection.programsEnrolled.includes(+programId)) {
      const errors = 'Already enrolled for program';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    let program = await this.programRepository.findOne(programId, {
      relations: ['customCriteria'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    await this.proofService.validateProof(program.proofRequest, proof, did);

    const questionAnswerList = this.createQuestionAnswerList(program, proof);
    connection.customData = this.getPersitentDataFromProof(
      connection.customData,
      questionAnswerList,
      program.customCriteria,
    );

    // Calculates the score based on the ctritria of a program and the aggregrated score list
    const totalScore = this.calculateScoreAllCriteria(
      program.customCriteria,
      questionAnswerList,
    );
    connection.inclusionScore = totalScore;

    // Add to enrolled-array, if not yet present
    const index = connection.programsEnrolled.indexOf(
      parseInt(String(programId), 10),
    );
    if (index <= -1) {
      connection.programsEnrolled.push(programId);
    }

    // Depending on method: immediately determine inclusionStatus (minimumScore) or later (highestScoresX)
    let inclusionRequestStatus: InclusionRequestStatus;
    if (program.inclusionCalculationType === 'minimumScore') {
      // Checks if PA is elegible based on the minimum score of the program
      let inclusionResult = totalScore >= program.minimumScore;

      if (inclusionResult) {
        connection.programsIncluded.push(programId);
        this.notifyInclusionStatus(connection, programId, inclusionResult);
      } else if (!inclusionResult) {
        connection.programsExcluded.push(programId);
        this.notifyInclusionStatus(connection, programId, inclusionResult);
      }
      inclusionRequestStatus = { status: 'done' };
    } else if (program.inclusionCalculationType === 'highestScoresX') {
      // In this case an inclusion-status can only be given later.
      inclusionRequestStatus = { status: 'pending' };
    }

    await this.connectionRepository.save(connection);

    return inclusionRequestStatus;
  }

  private async notifyInclusionStatus(
    connection,
    programId,
    inclusionResult,
  ): Promise<void> {
    this.smsService.notifyBySms(
      connection.phoneNumber,
      connection.preferredLanguage,
      inclusionResult ? 'included' : 'excluded',
      programId,
    );
    this.voiceService.notifyByVoice(
      connection.phoneNumber,
      connection.preferredLanguage,
      inclusionResult ? 'included' : 'excluded',
      programId,
    );
  }

  public async getInclusionStatus(
    programId: number,
    did: string,
  ): Promise<InclusionStatus> {
    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    let inclusionStatus: InclusionStatus;
    if (
      connection.programsIncluded.indexOf(parseInt(String(programId), 10)) > -1
    ) {
      inclusionStatus = { status: 'included' };
    } else if (
      connection.programsExcluded.indexOf(parseInt(String(programId), 10)) > -1
    ) {
      inclusionStatus = { status: 'excluded' };
    } else {
      inclusionStatus = { status: 'unavailable' };
    }
    return inclusionStatus;
  }

  public async include(programId: number, dids: object): Promise<void> {
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let did of JSON.parse(dids['dids'])) {
      let connection = await this.connectionRepository.findOne({
        where: { did: did.did },
      });
      if (!connection) {
        continue;
      }

      // Add to inclusion-array, if not yet present
      const indexIn = connection.programsIncluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexIn <= -1) {
        connection.programsIncluded.push(programId);
        this.notifyInclusionStatus(connection, programId, true);
      }
      // Remove from exclusion-array, if present
      const indexEx = connection.programsExcluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexEx > -1) {
        connection.programsExcluded.splice(indexEx, 1);
      }
      await this.connectionRepository.save(connection);
    }
  }

  public async exclude(programId: number, dids: object): Promise<void> {
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let did of JSON.parse(dids['dids'])) {
      let connection = await this.connectionRepository.findOne({
        where: { did: did.did },
      });
      if (!connection) {
        continue;
      }

      // Add to exclusion-array, if not yet present
      const indexEx = connection.programsExcluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexEx <= -1) {
        connection.programsExcluded.push(programId);
        this.notifyInclusionStatus(connection, programId, false);
      }
      // Remove from inclusion-array, if present
      const indexIn = connection.programsIncluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexIn > -1) {
        connection.programsIncluded.splice(indexIn, 1);
      }
      await this.connectionRepository.save(connection);
    }
  }

  private createQuestionAnswerList(
    program: ProgramEntity,
    proof: string,
  ): object {
    // Convert the proof in an array, for some unknown reason it has to be JSON parse multiple times
    const proofJson = JSON.parse(proof);
    const proofObject = JSON.parse(proofJson['proof']);
    const revealedAttrProof = proofObject['requested_proof']['revealed_attrs'];

    // Uses the proof request to relate the revealed_attr from the proof to the corresponding ctriteria'
    const proofRequest = JSON.parse(program.proofRequest);
    const attrRequest = proofRequest['requested_attributes'];

    const inclusionCriteriaAnswers = {};
    for (let attrKey in revealedAttrProof) {
      let attrValue = revealedAttrProof[attrKey];
      let newKeyName = attrRequest[attrKey]['name'];
      inclusionCriteriaAnswers[newKeyName] = attrValue['raw'];
    }
    return inclusionCriteriaAnswers;
  }

  private calculateScoreAllCriteria(
    programCriteria: CustomCriterium[],
    scoreList: object,
  ): number {
    let totalScore = 0;
    for (let criterium of programCriteria) {
      let criteriumName = criterium.criterium;
      if (scoreList[criteriumName]) {
        let answerPA = scoreList[criteriumName];
        switch (criterium.answerType) {
          case 'dropdown': {
            totalScore =
              totalScore + this.getScoreForDropDown(criterium, answerPA);
          }
          case 'numeric':
            totalScore =
              totalScore + this.getScoreForNumeric(criterium, answerPA);
        }
      }
    }
    return totalScore;
  }

  private getScoreForDropDown(
    criterium: CustomCriterium,
    answerPA: object,
  ): number {
    let score = 0;
    const options = JSON.parse(JSON.stringify(criterium.options));
    for (let value of options) {
      if (value.option == answerPA) {
        score = criterium.scoring[value.option];
      }
    }
    return score;
  }

  private getScoreForNumeric(
    criterium: CustomCriterium,
    answerPA: number,
  ): number {
    let score = 0;
    if (criterium.scoring['multiplier']) {
      if (isNaN(answerPA)) {
        answerPA = 0;
      }
      score = criterium.scoring['multiplier'] * answerPA;
    }
    return score;
  }

  private getPersitentDataFromProof(
    customData: Record<string, any>,
    questionAnswerList: Record<string, any>,
    programCriteria: CustomCriterium[],
  ): any {
    for (let criterium of programCriteria) {
      if (criterium.persistence) {
        let criteriumName = criterium.criterium;
        customData[criteriumName] = questionAnswerList[criteriumName];
      }
    }
    return customData;
  }

  public async getTotalIncluded(programId): Promise<number> {
    const includedConnections = await this.getIncludedConnections(programId);
    return includedConnections.length;
  }

  public async getEnrolled(
    programId: number,
    privacy: boolean,
  ): Promise<any[]> {
    const enrolledConnections = await this.getEnrolledConnections(
      programId,
      privacy,
    );
    return enrolledConnections;
  }

  public async payout(
    programId: number,
    installment: number,
    amount: number,
  ): Promise<any> {
    let program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    if (!program || program.state === 'design') {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const includedConnections = await this.getIncludedConnections(programId);

    if (includedConnections.length < 1) {
      return {
        status: 'error',
        message: 'There are no included PA for this program',
      };
    }

    const fundingOverview = await this.fundingService.getProgramFunds(
      programId,
    );
    const fundsNeeded = amount * includedConnections.length;
    if (fundsNeeded > fundingOverview.totalAvailable) {
      const errors = 'Insufficient funds';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let fsp of program.financialServiceProviders) {
      await this.createSendPaymentListFsp(
        fsp,
        includedConnections,
        amount,
        program,
        installment,
      );
    }
    return { status: 'succes', message: 'Sent instructions to FSP' };
  }

  private async getEnrolledConnections(
    programId: number,
    privacy: boolean,
  ): Promise<any[]> {
    const connections = await this.connectionRepository.find({
      order: { inclusionScore: 'DESC' },
    });
    const enrolledConnections = [];
    for (let connection of connections) {
      let connectionNew: any;
      if (!privacy) {
        if (
          connection.programsEnrolled.includes(+programId)
        ) {
          connectionNew = {
            did: connection.did,
            score: connection.inclusionScore,
            created: connection.created,
            updated: connection.updated,
            enrolled: connection.programsEnrolled.includes(+programId),
            included: connection.programsIncluded.includes(+programId),
            excluded: connection.programsExcluded.includes(+programId),
          };
          enrolledConnections.push(connectionNew);
        }
      } else {
        if (
          connection.programsIncluded.includes(+programId) ||
          connection.programsExcluded.includes(+programId)
        ) {
          connectionNew = {
            did: connection.did,
            score: connection.inclusionScore,
            created: connection.created,
            updated: connection.updated,
            name: connection.customData['name'],
            dob: connection.customData['dob'],
            included: connection.programsIncluded.includes(+programId),
          };
          enrolledConnections.push(connectionNew);
        }
      }
    }
    return enrolledConnections;
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

  private async createSendPaymentListFsp(
    fsp: FinancialServiceProviderEntity,
    includedConnections: ConnectionEntity[],
    amount: number,
    program: ProgramEntity,
    installment: number,
  ): Promise<any> {
    const paymentList = [];
    const connectionsForFsp = [];
    for (let connection of includedConnections) {
      if (connection.fsp.id === fsp.id) {
        let paymentDetails = {
          // phone: connection.phoneNumber,
          id_details: connection.customData['id_number'],
          amount: amount,
        };
        paymentList.push(paymentDetails);
        connectionsForFsp.push(connection);
      }
    }

    const fspAiSelected = API.fsp.find(obj => obj.name == fsp.fsp);

    if (paymentList.length > 0) {
      const response = await this.httpService
        .post(fspAiSelected.payout, paymentList)
        .toPromise();
      if (!response.data) {
        const errors = 'Payment instruction not send';
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      for (let connection of connectionsForFsp) {
        this.storeTransaction(amount, connection, fsp, program, installment);
      }
    }
  }
  private storeTransaction(
    amount: number,
    connection: ConnectionEntity,
    fsp: FinancialServiceProviderEntity,
    program: ProgramEntity,
    installment: number,
  ): any {
    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.created = new Date();
    transaction.connection = connection;
    transaction.financialServiceProvider = fsp;
    transaction.program = program;
    transaction.installment = installment;
    transaction.status = 'sent-order';

    this.transactionRepository.save(transaction);
  }

  public async getInstallments(programId: number): Promise<any> {
    const installments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.amount, transaction.installment')
      .addSelect('MIN(transaction.created)', 'installmentDate')
      .where('transaction.program.id = :programId', { programId: programId })
      .groupBy('transaction.amount, transaction.installment')
      .getRawMany();
    return installments;
  }

  public async getFunds(programId: number): Promise<FundingOverview> {
    // TO DO: call Disberse-API here, for now static data.

    const program = await this.programRepository.findOne({
      where: { id: programId },
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const fundsDisberse = await this.fundingService.getProgramFunds(programId);
    return fundsDisberse;
  }

  public async getFspById(id: number): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne(id, {
      relations: ['attributes'],
    });
    return fsp;
  }

  public async getPaymentDetails(
    programId: number,
    installmentId: number,
  ): Promise<any> {
    let rawPaymentDetails = await this.getPaymentDetailsInstallment(
      programId,
      installmentId,
    );

    let installmentTime = 'completed';
    if (rawPaymentDetails.length === 0) {
      rawPaymentDetails = await this.getPaymentDetailsFuture(programId);
      installmentTime = 'future';
    }
    const paymentDetails = [];
    rawPaymentDetails.forEach(rawTransaction => {
      let transaction = {
        ...rawTransaction,
        ...rawTransaction.connection_customData,
      };
      delete transaction['connection_customData'];
      paymentDetails.push(transaction);
    });

    const response = {
      fileName: `payment-details-${installmentTime}-installment-${programId}.csv`,
      data: this.jsonToCsv(paymentDetails),
    };

    return response;
  }

  public async getPaymentDetailsInstallment(
    programId: number,
    installmentId: number,
  ): Promise<any> {
    return await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.amount',
        'transaction.installment',
        'connection.phoneNumber',
        'connection.customData',
      ])
      .leftJoin('transaction.connection', 'connection')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.installment = :installmentId', {
        installmentId: installmentId,
      })
      .getRawMany();
  }

  public async getPaymentDetailsFuture(programId: number): Promise<any> {
    const connections = await this.connectionRepository
      .createQueryBuilder('connection')
      .select([
        'connection.phoneNumber',
        'connection.customData',
        'connection.programsIncluded',
      ])
      .getRawMany();
    const rawPaymentDetails = [];
    for (let connection of connections) {
      if (connection.connection_programsIncluded.includes(+programId)) {
        delete connection['connection_programsIncluded'];
        rawPaymentDetails.push(connection);
      }
    }
    return rawPaymentDetails;
  }

  public jsonToCsv(items: any): any {
    if (items.length === 0) {
      return '';
    }
    const replacer = (key, value): any => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(items[0]);
    let csv = items.map(row =>
      header
        .map(fieldName => JSON.stringify(row[fieldName], replacer))
        .join(','),
    );
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');
    return csv;
  }
}
