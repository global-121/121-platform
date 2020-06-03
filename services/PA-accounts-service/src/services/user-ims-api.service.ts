import { ApiService } from './api.service';
import { Injectable } from '@nestjs/common';
import { URL_USERIMS } from '../config';
import { Wallet } from 'src/credential/interfaces/wallet-credentials.interface';

@Injectable()
export class UserImsApiService {
  public constructor(private readonly apiService: ApiService) {}

  private correlation = {
    correlationID: 'test',
  };

  public async storeCredential(
    credDefID: string,
    credentialRequestMetadata: any,
    credential: any,
    wallet: Wallet,
  ): Promise<any> {
    return await this.apiService.post(URL_USERIMS, '/credential/store', {
      credDefID,
      credentialRequestMetadata,
      credential,
      wallet,
      correlation: this.correlation,
    });
  }

  public async getProofFromWallet(
    proofRequest: any,
    wallet: Wallet,
  ): Promise<any> {
    const proofRequestJsonData = JSON.stringify(proofRequest);
    return await this.apiService.post(URL_USERIMS, '/proof/request', {
      proofRequestJsonData,
      wallet,
      correlation: this.correlation,
    });
  }
}
