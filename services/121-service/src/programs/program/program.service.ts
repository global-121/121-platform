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
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult, Like } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../../user/user.entity';
import { CreateProgramDto } from './dto';

import { ProgramRO, ProgramsRO, SimpleProgramRO } from './program.interface';
import { InclusionStatus } from './dto/inclusion-status.dto';
import { InclusionRequestStatus } from './dto/inclusion-request-status.dto';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { SmsService } from '../../notifications/sms/sms.service';
import { API } from '../../config';
import { Length } from 'class-validator';
import { FundsEntity } from './funds.entity';

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
  @InjectRepository(FundsEntity)
  public fundsRepository: Repository<FundsEntity>;


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
  ) {}

  public async findOne(where): Promise<ProgramEntity> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .leftJoinAndSelect(
        'program.financialServiceProviders',
        'financialServiceProvider',
      )
      .leftJoinAndSelect('program.aidworkers', 'aidworker');
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
        throw new HttpException({ errors }, 404);
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
        throw new HttpException({ errors }, 404);
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

  public async publish(programId: number): Promise<SimpleProgramRO> {
    const selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == true) {
      const errors = { Program: ' already published' };
      throw new HttpException({ errors }, 401);
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
      throw new HttpException({ errors }, 401);
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
      published: program.published,
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
      throw new HttpException({ errors }, 404);
    }

    if (connection.programsEnrolled.includes(+programId)) {
      const errors = 'Already enrolled for program';
      throw new HttpException({ errors }, 404);
    }

    let program = await this.programRepository.findOne(programId, {
      relations: ['customCriteria'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 404);
    }

    const validProof = await this.proofService.validateProof(
      program.proofRequest,
      proof,
      did,
    );

    let inclusionRequestStatus: InclusionRequestStatus;

    const questionAnswerList = this.createQuestionAnswerList(program, proof);
    connection.customData = this.getPersitentDataFromProof(
      connection.customData,
      questionAnswerList,
      program.customCriteria,
    );

    // For now always minimum-score approach: this will need to be split for the pilot
    if (
      program.inclusionCalculationType === 'minimumScore' ||
      program.inclusionCalculationType === 'highestScoresX'
    ) {
      let inclusionResult: boolean = await this.calculateInclusion(
        program,
        questionAnswerList,
      );
      if (inclusionResult) {
        connection.programsIncluded.push(programId);
        this.smsService.notifyBySms(
          connection.phoneNumber,
          connection.preferredLanguage,
          'included',
          programId,
        );
        this.voiceService.notifyByVoice(
          connection.phoneNumber,
          connection.preferredLanguage,
          'included',
          programId,
        );
      } else if (!inclusionResult) {
        this.smsService.notifyBySms(
          connection.phoneNumber,
          connection.preferredLanguage,
          'excluded',
          programId,
        );
        this.voiceService.notifyByVoice(
          connection.phoneNumber,
          connection.preferredLanguage,
          'excluded',
          programId,
        );
        connection.programsExcluded.push(programId);
      }
      inclusionRequestStatus = { status: 'done' };
    } else {
      inclusionRequestStatus = { status: 'pending' };
    }

    await this.connectionRepository.save(connection);

    return inclusionRequestStatus;
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
      throw new HttpException({ errors }, 404);
    }
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 404);
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

  public async calculateInclusion(
    program: ProgramEntity,
    questionAnswerList: object,
  ): Promise<boolean> {
    // Calculates the score based on the ctritria of a program and the aggregrated score list
    const totalScore = this.calculateScoreAllCriteria(
      program.customCriteria,
      questionAnswerList,
    );

    // Checks if PA is elegible based on the minimum score of the program
    const included = totalScore >= program.minimumScore;
    return included;
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
    customData: Object,
    questionAnswerList: Object,
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
  public async payout(programId: number, amount: number) {
    let program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    if (!program || !program.published) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 404);
    }

    const connections = await this.connectionRepository
      .createQueryBuilder('table')
      .where('1 =1')
      .getMany();

    const includedConnections = [];
    for (let connection of connections) {
      if (connection.programsIncluded.includes(programId)) {
        includedConnections.push(connection);
      }
    }
    if (includedConnections.length < 1){
      const errors = 'There are no included PA for this program';
      throw new HttpException({ errors }, 404);
    }

    const availableFunds = await this.fundingService.getProgramFunds(programId)
    const fundsNeeded = amount * includedConnections.length
    if (fundsNeeded > availableFunds) {
      const errors = 'Not enough available funds';
      throw new HttpException({ errors }, 404);
    }


    for (let fsp of program.financialServiceProviders) {
      await this.createSendPaymentListFsp(
        fsp,
        includedConnections,
        amount,
        program,
      );
    }
  }

  private async createSendPaymentListFsp(
    fsp: FinancialServiceProviderEntity,
    includedConnections: ConnectionEntity[],
    amount: number,
    program: ProgramEntity,
  ) {
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
        throw new HttpException({ errors }, 404);
      }
      for (let connection of connectionsForFsp) {
        this.storeTransaction(amount, connection, fsp, program);
      }
    }
  }
  private storeTransaction(
    amount: number,
    connection: ConnectionEntity,
    fsp: FinancialServiceProviderEntity,
    program: ProgramEntity,
  ) {
    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.created = new Date();
    transaction.connection = connection;
    transaction.financialServiceProvider = fsp;
    transaction.program = program;
    transaction.status = 'send-order';

    this.transactionRepository.save(transaction);
  }

  public async getFunds(programId: number): Promise<any> {
    // TO DO: call Disberse-API here, for now static data.
    const fundsDisberse = {
      totalRaised: 1000,
      totalTransferred: 400
    };

    const program = await this.programRepository.findOne({ where: { id: programId } });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 404);
    }
    let funds = await this.fundsRepository.findOne({ where: { program: { id: programId } } });
    if (!funds) {
      funds = new FundsEntity();
    }
    funds.totalRaised = fundsDisberse.totalRaised;
    funds.totalTransferred = fundsDisberse.totalTransferred;
    funds.totalAvailable = fundsDisberse.totalRaised - fundsDisberse.totalTransferred;
    funds.program = program;
    await this.fundsRepository.save(funds);

    return this.fundsRepository.findOne({ select: ["totalRaised", "totalTransferred", "totalAvailable", "updated"], where: { program: { id: programId } } });
  }

}
