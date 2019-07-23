import { Injectable } from '@nestjs/common';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { CredentialValuesDto } from './dto/credential-values.dto';
import { ProgramEntity } from '../../programs/program/program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramService } from '../../programs/program/program.service';
import { PrefilledAnswersDto } from './dto/prefilled-answers.dto';
import { CredentialEntity } from './credential.entity';

@Injectable()
export class CredentialService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(CredentialEntity)
  private readonly credentialRepository: Repository<CredentialEntity>;
  
  // Used by PA
  public async getOffer(did: string): Promise<EncryptedMessageDto> {
    // tyknid.getCredentialOffer()`;
    did;
    const result = { message: 'encrypted:example' };
    return result;
  }

  // PA: get attributes based on programId
  public async getAttributes(programId: number): Promise<any[]> {
    const programService = new ProgramService();
    let selectedProgram = await programService.findOne(programId);
    let attributes = [];
    for (let criterium of selectedProgram.customCriteria){
      attributes.push(criterium);
    }
    return attributes;
  }

  // PA: post answers to attributes
  public async prefilledAnswers(did: string, programId: number, prefilledAnswers: PrefilledAnswersDto): Promise<any[]> {
    
    let credentials = [];
    for (let answer of prefilledAnswers.attributes) {
      let credential = new CredentialEntity;
      credential.did = did;
      credential.programId = programId;
      credential.attribute = answer.attribute;
      credential.answer = answer.answer;
      const newCredential = await this.credentialRepository.save(credential);
      credentials.push(newCredential);
    }
    return credentials;   

  }

  // Used by PA
  public async request(
    encryptedCredentialRequest: EncryptedMessageDto,
  ): Promise<void> {
    encryptedCredentialRequest;
    // tyknid.getIssueCredential()`;
  }

  // Used by Aidworker
  public async issue(credentialValues: CredentialValuesDto): Promise<void> {
    credentialValues;
    // tyknid.getIssueCredential(credentialValues)`;
  }

  // Used by PA
  public async get(did: string): Promise<EncryptedMessageDto> {
    did;
    const result = { message: 'encrypted:example' };
    return result;
  }
}
