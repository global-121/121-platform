import { LookupService } from './../../notifications/lookup/lookup.service';
import { CredentialIssueDto } from './dto/credential-issue.dto';
import { CredentialRequestDto } from './dto/credential-request.dto';
import { CredentialRequestEntity } from './credential-request.entity';
import {
  Injectable,
  HttpException,
  Inject,
  forwardRef,
  HttpService,
  HttpStatus,
} from '@nestjs/common';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { ProgramEntity } from '../../programs/program/program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, getRepository } from 'typeorm';
import { ProgramService } from '../../programs/program/program.service';
import { PrefilledAnswerDto } from './dto/prefilled-answers.dto';
import { CredentialAttributesEntity } from './credential-attributes.entity';
import { CredentialEntity } from './credential.entity';
import { ConnectionEntity } from '../create-connection/connection.entity';
import { UserEntity } from '../../user/user.entity';
import { API } from '../../config';
import { DownloadData } from './interfaces/download-data.interface';
import {
  FspAnswersAttrInterface,
  AnswerSet,
} from '../../programs/fsp/fsp-interface';
import { FspAttributeEntity } from '../../programs/fsp/fsp-attribute.entity';

@Injectable()
export class CredentialService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(CredentialAttributesEntity)
  private readonly credentialAttributesRepository: Repository<
    CredentialAttributesEntity
  >;
  @InjectRepository(CredentialRequestEntity)
  private readonly credentialRequestRepository: Repository<
    CredentialRequestEntity
  >;
  @InjectRepository(CredentialEntity)
  private readonly credentialRepository: Repository<CredentialEntity>;
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(FspAttributeEntity)
  private readonly fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  public constructor(
    @Inject(forwardRef(() => ProgramService))
    private readonly programService: ProgramService,
    private readonly httpService: HttpService,
    private readonly lookupService: LookupService,
  ) {}
  // Use by HO is done automatically when a program is published
  public async createOffer(credDefId: string): Promise<object> {
    // const credentialOffer = tyknidtyknid.createCredentialOffer(credDefId)
    const credentialOfferPost = {
      credDefID: credDefId,
      correlation: {
        correlationID: 'test',
      },
    };

    const response = await this.httpService
      .post(API.credential.credoffer, credentialOfferPost)
      .toPromise();
    if (!response.data) {
      const errors = 'Credoffer not created';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return response.data;
  }

  // Used by PA
  public async getOffer(programId: number): Promise<object> {
    const program = await this.programService.findOne(programId);
    const result = program.credOffer;
    return result;
  }

  // PA: get attributes based on programId
  public async getAttributes(programId: number): Promise<any[]> {
    let selectedProgram = await this.programService.findOne(programId);
    let attributes = [];
    if (selectedProgram) {
      for (let criterium of selectedProgram.customCriteria) {
        attributes.push(criterium);
      }
    } else {
      const errors = 'Program does not exist or is not published';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return attributes;
  }

  // PA: post answers to attributes
  public async prefilledAnswers(
    did: string,
    programId: number,
    prefilledAnswersRaw: PrefilledAnswerDto[],
  ): Promise<any[]> {
    //Then save new information
    const prefilledAnswers = await this.cleanAnswers(
      prefilledAnswersRaw,
      programId,
    );
    let credentials = [];
    for (let answer of prefilledAnswers) {
      const oldAttribute = await this.credentialAttributesRepository.findOne({
        where: { did: did, programId: programId, attribute: answer.attribute },
      });
      if (!oldAttribute) {
        let credential = new CredentialAttributesEntity();
        credential.did = did;
        credential.attributeId = answer.attributeId;
        credential.attribute = answer.attribute;
        credential.answer = answer.answer;
        let newCredential;
        credential.programId = programId;

        newCredential = await this.credentialAttributesRepository.save(
          credential,
        );
        credentials.push(newCredential);
      }
    }

    const connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (
      !connection.customData ||
      Object.keys(connection.customData).length === 0
    ) {
      await this.storePersistentAnswers(prefilledAnswers, programId, did);
    }
    return credentials;
  }

  public async cleanAnswers(
    answers: PrefilledAnswerDto[],
    programId: number,
  ): Promise<PrefilledAnswerDto[]> {
    const answerTypeTel = 'tel';
    const program = await this.programService.findOne(programId);
    const phonenumberTypedAnswers = [];
    for (let criterium of program.customCriteria) {
      if (criterium.answerType == answerTypeTel) {
        phonenumberTypedAnswers.push(criterium.criterium);
      }
    }
    const fspTelAttributes = await this.fspAttributeRepository.find({
      where: { answerType: answerTypeTel },
    });
    for (let fspAttr of fspTelAttributes) {
      phonenumberTypedAnswers.push(fspAttr.name);
    }

    const cleanedAnswers = [];
    for (let answer of answers) {
      if (phonenumberTypedAnswers.includes(answer.attribute)) {
        answer.answer = await this.lookupService.lookupAndCorrect(
          answer.answer,
        );
      }
      cleanedAnswers.push(answer);
    }
    return cleanedAnswers;
  }

  public async storePersistentAnswers(
    answersRaw,
    programId,
    did,
  ): Promise<void> {
    const answers = await this.cleanAnswers(answersRaw, programId);
    let program = await this.programRepository.findOne(programId, {
      relations: ['customCriteria'],
    });
    const persistentCriteria = [];
    for (let criterium of program.customCriteria) {
      if (criterium.persistence) {
        persistentCriteria.push(criterium.criterium);
      }
    }
    const customDataToStore = {};
    for (let answer of answers) {
      if (persistentCriteria.includes(answer.attribute)) {
        customDataToStore[answer.attribute] = answer.answer;
      }
    }
    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    connection.customData = JSON.parse(JSON.stringify(customDataToStore));
    await this.connectionRepository.save(connection);
  }

  // AW: get answers to attributes for a given PA (identified first through did/QR)
  public async getPrefilledAnswers(
    did: string,
    programId: number,
  ): Promise<CredentialAttributesEntity[]> {
    let credentials;
    credentials = await this.credentialAttributesRepository.find({
      where: { did: did, programId: programId },
    });
    return credentials;
  }

  public async downloadData(userId: number): Promise<DownloadData> {
    const user = await this.userRepository.findOne(userId, {
      relations: ['assignedProgram'],
    });
    if (!user || !user.assignedProgram || user.assignedProgram.length === 0) {
      const errors = 'User not found or no assigned programs';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    const data = {
      answers: await this.getAllPrefilledAnswers(user),
      fspData: await this.getAllFspAnswerData(),
      didQrMapping: await this.getQrDidMapping(),
    };
    return data;
  }

  public async getAllPrefilledAnswers(
    user: UserEntity,
  ): Promise<CredentialAttributesEntity[]> {
    const programIds = user.assignedProgram.map(program => {
      return { programId: program.id };
    });
    const answers = await this.credentialAttributesRepository.find({
      where: programIds,
    });
    return answers;
  }

  public async getAllFspAnswerData(): Promise<FspAnswersAttrInterface[]> {
    const connections = await getRepository(ConnectionEntity)
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.fsp', 'fsp')
      .leftJoinAndSelect('fsp.attributes', ' fsp_attribute.fsp')
      .where('connection.fsp IS NOT NULL')
      .andWhere('connection.validationDate IS NULL') // Filter to only download data for PA's not validated yet
      .getMany();

    const fspDataPerConnection = [];
    for (const connection of connections) {
      const answers = this.getFspAnswers(
        connection.fsp.attributes,
        connection.customData,
      );
      const fspData = {
        attributes: connection.fsp.attributes,
        answers: answers,
        did: connection.did,
      };
      fspDataPerConnection.push(fspData);
    }
    return fspDataPerConnection;
  }

  public getFspAnswers(
    fspAttributes: FspAttributeEntity[],
    customData: JSON,
  ): AnswerSet {
    const fspAttributeNames = [];
    for (const attribute of fspAttributes) {
      fspAttributeNames.push(attribute.name);
    }
    const fspCustomData = {};
    for (const key in customData) {
      if (fspAttributeNames.includes(key)) {
        fspCustomData[key] = {
          code: key,
          value: customData[key],
        };
      }
    }
    return fspCustomData;
  }

  public async getQrDidMapping(): Promise<ConnectionEntity[]> {
    return await this.connectionRepository
      .createQueryBuilder('connection')
      .select(['connection.qrIdentifier', 'connection.did'])
      .where('connection.validationDate IS NULL') // Filter to only download data for PA's not validated yet
      .getMany();
  }

  // AW: delete answers to attributes for a given PA after issuing credentials (identified first through did/QR)
  public async deletePrefilledAnswers(
    did: string,
    programId: number,
  ): Promise<DeleteResult> {
    return await this.credentialAttributesRepository.delete({
      did: did,
      programId: programId,
    });
  }

  // Used by PA
  public async request(credRequest: CredentialRequestDto): Promise<void> {
    credRequest;

    const program = await this.programService.findOne(credRequest.programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const credentialRequestInfo = new CredentialRequestEntity();
    credentialRequestInfo.did = credRequest.did;
    credentialRequestInfo.program = program;
    // credentialRequestInfo.credOffer = tykn.decrypt(credRequest.credentialRequest)
    credentialRequestInfo.credentialRequest = JSON.parse(
      credRequest.encryptedCredentialRequest,
    );
    this.credentialRequestRepository.save(credentialRequestInfo);
  }

  // Used by Aidworker
  public async issue(payload: CredentialIssueDto): Promise<void> {
    await this.storePersistentAnswers(
      payload.attributes,
      payload.programId,
      payload.did,
    );
    await this.checkForOldCredential(payload.did, payload.programId);

    // Get related credential offer
    const program = await this.getRelatedProgram(payload.programId);
    const credentialOffer = program.credOffer;

    const queryResult = await this.getRelatedCredRequest(
      payload.programId,
      payload.did,
    );
    const credentialRequest = queryResult.credentialRequest;

    const updatedAnswers = payload.attributes;
    let attributesPost = {};
    for (let answer of updatedAnswers) {
      attributesPost[answer.attribute] = answer.answer;
    }

    const credentialPost = {
      credOfferJsonData: credentialOffer['credOfferJsonData'],
      credentialRequest: credentialRequest['credentialRequest'],
      correlation: {
        correlationID: 'test',
      },
      attributes: attributesPost,
    };
    const response = await this.httpService
      .post(API.credential.issue, credentialPost)
      .toPromise();
    const createdCredential = response.data;

    const credentialData = new CredentialEntity();
    credentialData.credential = createdCredential;
    credentialData.did = payload.did;
    credentialData.program = program;
    await this.credentialRepository.save(credentialData);

    await this.cleanupIssueCredData(payload.did, payload.programId);
    await this.updateConnectionStatus(payload.did);
    await this.paAccountsCredentialReady(payload.did, payload.programId);
  }

  private async updateConnectionStatus(did): Promise<void> {
    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    connection.validationDate = new Date();
    await this.connectionRepository.save(connection);
  }

  private async getRelatedProgram(programId: number): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      id: programId,
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  private async getRelatedCredRequest(
    programId: number,
    did: string,
  ): Promise<CredentialRequestEntity> {
    const queryResult = await this.credentialRequestRepository.findOne({
      program: {
        id: programId,
      },
      did: did,
    });
    if (!queryResult) {
      const errors = 'Credential request not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return queryResult;
  }

  private async checkForOldCredential(
    did: string,
    programId: number,
  ): Promise<void> {
    const oldCredential = await this.credentialRepository.findOne({
      program: {
        id: programId,
      },
      did: did,
    });
    if (oldCredential) {
      const errors =
        'A credential has already been created for this did for this program';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
  }

  public async cleanupIssueCredData(
    did: string,
    programId: number,
  ): Promise<void> {
    await this.credentialRequestRepository.delete({
      program: {
        id: programId,
      },
      did: did,
    });
    this.deletePrefilledAnswers(did, programId);
  }

  public async paAccountsCredentialReady(
    did: string,
    programId: number,
  ): Promise<void> {
    const data = {
      did: did,
      programId: programId,
    };
    await this.httpService
      .post(API.paAccounts.getCredentialHandleProof, {
        didProgramDto: data,
        apiKey: process.env.PA_API_KEY,
      })
      .toPromise();
  }

  // Used by PA
  public async get(did: string): Promise<EncryptedMessageDto> {
    const queryResult = await this.credentialRepository.findOne({
      did: did,
    });

    if (!queryResult) {
      return { message: '' };
    }
    const encrypyedCredential = { message: queryResult.credential };
    return encrypyedCredential;
  }

  public async delete(did: string): Promise<DeleteResult> {
    const deleteResult = await this.credentialRepository.delete({ did: did });
    return deleteResult;
  }
}
