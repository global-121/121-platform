import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { Injectable, HttpService } from '@nestjs/common';
import { URL_121_SERVICE, URL_USERIMS } from '../config';
import { Wallet } from 'src/credential/interfaces/wallet-credentials.interface';

@Injectable()
export class UserImsApiService {
  private readonly apiService: ApiService;
  public constructor() {}

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
    // const proofRequestJsonData = proofRequest;
    return await this.apiService.post(URL_USERIMS, '/proof/request', {
      proofRequestJsonData,
      wallet,
      correlation: this.correlation,
    });
  }
}
