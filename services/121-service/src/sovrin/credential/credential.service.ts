import { CredentialIssueDto } from './dto/credential-issue.dto';
import { CredentialRequestDto } from './dto/credential-request.dto';
import { CredentialRequestEntity } from './credential-request.entity';
import { Injectable, HttpException } from '@nestjs/common';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { CredentialValuesDto } from './dto/credential-values.dto';
import { ProgramEntity } from '../../programs/program/program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { ProgramService } from '../../programs/program/program.service';
import { PrefilledAnswersDto } from './dto/prefilled-answers.dto';
import { CredentialAttributesEntity } from './credential-attributes.entity';
import { CredentialEntity } from './credential.entity';

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

  // Use by HO is done automatically when a program is published
  public async createOffer(credDefId: string): Promise<object> {
    // const credentialOffer = tyknidtyknid.createCredentialOffer(credDefId)
    return { example: 'credoffer' };
  }

  // Used by PA
  public async getOffer(programId: number): Promise<object> {
    const programService = new ProgramService();
    const program = await programService.findOne(programId);
    const result = program.credOffer;
    return result;
  }

  // PA: get attributes based on programId
  public async getAttributes(programId: number): Promise<any[]> {
    const programService = new ProgramService();
    let selectedProgram = await programService.findOne(programId);
    let attributes = [];
    for (let criterium of selectedProgram.customCriteria) {
      attributes.push(criterium);
    }
    return attributes;
  }

  // PA: post answers to attributes
  public async prefilledAnswers(
    did: string,
    programId: number,
    prefilledAnswers: PrefilledAnswersDto,
  ): Promise<any[]> {
    let credentials = [];
    for (let answer of prefilledAnswers.attributes) {
      let credential = new CredentialAttributesEntity();
      credential.did = did;
      credential.programId = programId;
      credential.attributeId = answer.attributeId;
      credential.attribute = answer.attribute;
      credential.answer = answer.answer;
      const newCredential = await this.credentialAttributesRepository.save(
        credential,
      );
      credentials.push(newCredential);
    }
    return credentials;
  }

  // AW: get answers to attributes for a given PA (identified first through did/QR)
  public async getPrefilledAnswers(
    did: string,
  ): Promise<CredentialAttributesEntity[]> {
    let credentials = await this.credentialAttributesRepository.find({
      where: { did: did },
    });
    return credentials;
  }

  // AW: delete answers to attributes for a given PA after issuing credentials (identified first through did/QR)
  public async deletePrefilledAnswers(
    did: string,
  ): Promise<DeleteResult> {
    return await this.credentialAttributesRepository.delete({ did: did });
  }

  // Used by PA
  public async request(credRequest: CredentialRequestDto): Promise<void> {
    credRequest;

    const programService = new ProgramService();
    const program = await programService.findOne(credRequest.programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 400);
    }

    const credentialRequestInfo = new CredentialRequestEntity();
    credentialRequestInfo.did = credRequest.did;
    credentialRequestInfo.program = program;
    // credentialRequestInfo.credOffer = tykn.decrypt(credRequest.credentialRequest)
    credentialRequestInfo.credentialRequest = JSON.parse(
      '{ "example": "credentialRequest" }',
    );
    this.credentialRequestRepository.save(credentialRequestInfo);
  }

  // Used by Aidworker
  public async issue(payload: CredentialIssueDto): Promise<void> {
    // Get related credential offer
    const program = await this.getRelatedProgram(payload.programId);
    const credentialOffer = program.credOffer;

    // Get related credential request
    const queryResult = await this.getRelatedCredRequest(
      payload.programId,
      payload.did,
    );
    const credentialRequest = queryResult.credentialRequest;

    credentialOffer;
    credentialRequest;
    const credentialJson = payload.credentialJson;
    // const createdCredential = tyknid.createCredential(credentialOffer,credentialRequest,credentialJson)
    const createdCredential = 'exampleEncryptedCredential';

    const credentialData = new CredentialEntity();
    credentialData.credential = createdCredential;
    credentialData.did = payload.did;
    credentialData.program = program;
    await this.checkForOldCredential(payload.did, payload.programId);
    await this.credentialRepository.save(credentialData);
  }

  private async getRelatedProgram(programId: number): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      id: programId,
    });
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
