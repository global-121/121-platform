import { Injectable } from '@nestjs/common';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { CredentialValuesDto } from './dto/credential-values.dto';

@Injectable()
export class CredentialService {
  // Used by AP
  public async getOffer(): Promise<EncryptedMessageDto> {
    // tyknid.getCredentialOffer()`;
    const result = { message: 'encrypted:example' };
    return result;
  }

  // Used by AP
  public async request(
    encryptedCredentialRequest: EncryptedMessageDto,
  ): Promise<void> {
    encryptedCredentialRequest;
    // tyknid.getIssueCredential()`;
  }

  // Used by Fieldworker
  public async issue(credentialValues: CredentialValuesDto): Promise<void> {
    credentialValues;
    // tyknid.getIssueCredential(credentialValues)`;
  }

  // Used by ap
  public async get(did: string): Promise<void> {
    did;
  }
}
