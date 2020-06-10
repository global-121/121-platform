import { ApiService } from './api.service';
import { Injectable } from '@nestjs/common';
import { URL_121_SERVICE } from '../config';

@Injectable()
export class ProgramsServiceApiService {
  public constructor(private readonly apiService: ApiService) {}

  public async getCredential(did: string): Promise<any> {
    return await this.apiService.post(
      URL_121_SERVICE,
      '/sovrin/credential/get',
      {
        did,
      },
    );
  }
  public async deleteCredential(did: string): Promise<any> {
    return await this.apiService.post(
      URL_121_SERVICE,
      '/sovrin/credential/delete',
      {
        did,
      },
    );
  }

  public async getProofRequest(programId: number): Promise<any> {
    return await this.apiService.get(
      URL_121_SERVICE,
      '/sovrin/proof/proofRequest/' + programId,
    );
  }

  public async includeMe(
    did: string,
    programId: number,
    encryptedProof: string,
  ): Promise<any> {
    return await this.apiService.post(URL_121_SERVICE, '/programs/includeMe', {
      did,
      programId,
      encryptedProof,
    });
  }
}
