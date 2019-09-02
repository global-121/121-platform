import { CredentialIssueDto } from './dto/credential-issue.dto';
import { CredentialRequestDto } from './dto/credential-request.dto';
import { CredentialRequestEntity } from './credential-request.entity';
import { Injectable, HttpException, Inject, forwardRef, HttpService } from '@nestjs/common';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { ProgramEntity } from '../../programs/program/program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { ProgramService } from '../../programs/program/program.service';
import { PrefilledAnswersDto, PrefilledAnswerDto } from './dto/prefilled-answers.dto';
import { CredentialAttributesEntity } from './credential-attributes.entity';
import { IdentityAttributesEntity } from './identity-attributes.entity';
import { CredentialEntity } from './credential.entity';
import { API } from '../../config';

@Injectable()
export class CredentialService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(CredentialAttributesEntity)
  private readonly credentialAttributesRepository: Repository<CredentialAttributesEntity>;
  @InjectRepository(IdentityAttributesEntity)
  private readonly identityAttributesRepository: Repository<IdentityAttributesEntity>;
  @InjectRepository(CredentialRequestEntity)
  private readonly credentialRequestRepository: Repository<
    CredentialRequestEntity
  >;
  @InjectRepository(CredentialEntity)
  private readonly credentialRepository: Repository<CredentialEntity>;

  public constructor(
    @Inject(forwardRef(() => ProgramService))
    private readonly programService: ProgramService,
    private readonly httpService: HttpService,
  ) { }
  // Use by HO is done automatically when a program is published
  public async createOffer(credDefId: string): Promise<object> {
    // const credentialOffer = tyknidtyknid.createCredentialOffer(credDefId)
    const credentialOfferPost = {
      credDefID: credDefId,
      correlation: {
        "correlationID": "test"
      }
    }

    const response = await this.httpService.post(API.credential.credoffer, credentialOfferPost).toPromise();
    if (!response.data) {
      const errors = 'Credoffer not created';
      throw new HttpException({ errors }, 400);
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
    if (selectedProgram && selectedProgram.published === true) {
      for (let criterium of selectedProgram.customCriteria) {
        attributes.push(criterium);
      }
    } else {
      const errors = 'Program does not exist or is not published';
      throw new HttpException({ errors }, 401);
    }
    return attributes;
  }

  // PA: post answers to attributes
  public async prefilledAnswers(
    did: string,
    programId: number,
    credentialType: string,
    prefilledAnswers: PrefilledAnswerDto[],
  ): Promise<any[]> {
    //Delete existing entries for this DID*program first.
    if (credentialType === 'identity') {
      await this.identityAttributesRepository.delete({ did: did });
    } else if (credentialType === 'program') {
      await this.credentialAttributesRepository.delete({ did: did, programId: programId });
    }

    //Then save new information
    let credentials = [];
    for (let answer of prefilledAnswers) {
      let credential = new CredentialAttributesEntity();
      credential.did = did;
      credential.attributeId = answer.attributeId;
      credential.attribute = answer.attribute;
      credential.answer = answer.answer;
      let newCredential;
      if (credentialType === 'identity') {
        newCredential = await this.identityAttributesRepository.save(credential);
      } else if (credentialType === 'program') {
        credential.programId = programId;
        newCredential = await this.credentialAttributesRepository.save(credential);
      }
      credentials.push(newCredential);
    }
    return credentials;
  }

  // AW: get answers to attributes for a given PA (identified first through did/QR)
  public async getPrefilledAnswers(
    did: string,
    programId: number
  ): Promise<any[]> {
    const credentialType = isNaN(programId) ? 'identity' : 'program';
    let credentials;
    if (credentialType === 'identity') {
      credentials = await this.identityAttributesRepository.find({
        where: { did: did },
      });
    } else if (credentialType === 'program') {
      credentials = await this.credentialAttributesRepository.find({
        where: { did: did, programId: programId },
      });
    }
    return credentials;
  }

  // AW: delete answers to attributes for a given PA after issuing credentials (identified first through did/QR)
  public async deletePrefilledAnswers(did: string, programId: number): Promise<DeleteResult> {
    const credentialType = isNaN(programId) ? 'identity' : 'program';
    if (credentialType === 'identity') {
      return await this.identityAttributesRepository.delete({ did: did });
    } else if (credentialType === 'program') {
      return await this.credentialAttributesRepository.delete({ did: did });
    }
  }

  // Used by PA
  public async request(credRequest: CredentialRequestDto): Promise<void> {
    credRequest;

    const program = await this.programService.findOne(credRequest.programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 400);
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
    // Get related credential offer
    const program = await this.getRelatedProgram(payload.programId);
    const credentialOffer = program.credOffer;

    const queryResult = await this.getRelatedCredRequest(
      payload.programId,
      payload.did,
    );
    const credentialRequest = queryResult.credentialRequest;
    const preFilledAnswers = await this.getPrefilledAnswers(payload.did, payload.programId);
    let attributesPost = {};
    for (let answer of preFilledAnswers) {
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
    await this.checkForOldCredential(payload.did, payload.programId);
    await this.credentialRepository.save(credentialData);
  }

  private async getRelatedProgram(programId: number): Promise<ProgramEntity> {
    let program;
    if (!programId) {
      program = await this.programRepository.findOne({
        identityProgram: true,
      });
    } else {
      program = await this.programRepository.findOne({
        id: programId,
      });
    }
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException(
        {
          errors,
        },
        400,
      );
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
      throw new HttpException(
        {
          errors,
        },
        400,
      );
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
      throw new HttpException(
        {
          errors,
        },
        400,
      );
    }
  }

  // Used by PA
  public async get(did: string): Promise<EncryptedMessageDto> {
    const queryResult = await this.credentialRepository.findOne({
      did: did,
    });

    if (!queryResult) {
      const errors = 'Credential not found.';
      throw new HttpException(
        {
          errors,
        },
        400,
      );
    }
    const encrypyedCredential = { message: queryResult.credential };
    return encrypyedCredential;
  }
}
