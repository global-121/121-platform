import { UserImsApiService } from './../services/user-ims-api.service';
import { ProgramsServiceApiService } from './../services/programs-service-api.service';
import { DataStorageService } from './../data-storage/data-storage.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CredentialService {
  private paDataType = {
    username: 'username',
    wallet: 'wallet',
    credentialRequest: 'credentialRequest',
    credDefId: 'credDefId',
    status: 'status',
  };
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  private readonly dataStorageService: DataStorageService;
  private readonly programsApiService: ProgramsServiceApiService;
  private readonly userImsApiService: UserImsApiService;
  public constructor() {}

  public async getCredentialHandleProof(
    did: string,
    programId: number,
  ): Promise<void> {
    const findOneOptions = {
      did: did,
    };
    const user = await this.userRepository.findOne(findOneOptions);
    await this.getAndStoreCredential(did, user.id);
    await this.handleProof(did, programId, user.id);
  }

  public async getAndStoreCredential(
    did: string,
    userId: number,
  ): Promise<void> {
    const wallet = await this.getSovrinData(userId, this.paDataType.wallet);
    const credentialResponse = await this.programsApiService.getCredential(did);
    const credentialRequest = await this.getSovrinData(
      userId,
      this.paDataType.credentialRequest,
    );
    const credDefID = await this.getSovrinData(
      userId,
      this.paDataType.credDefId,
    );
    const credentialFormat = JSON.parse(credentialResponse.data.message);

    await this.userImsApiService.storeCredential(
      credDefID,
      credentialRequest.credentialRequestMetadata,
      credentialFormat.credential,
      wallet,
    );
    await this.programsApiService.deleteCredential(did);
  }

  private async handleProof(
    did: string,
    programId: number,
    userId: number,
  ): Promise<void> {
    let statusRetrieved: string;

    try {
      statusRetrieved = await this.dataStorageService.get(
        userId,
        this.paDataType.status,
      );
    } catch (e) {
      if (e.status === 404) {
        statusRetrieved = undefined;
      } else {
        console.log(e);
      }
    }

    if (!statusRetrieved) {
      const proofRequestResponse = await this.programsApiService.getProofRequest(
        programId,
      );
      const proofRequest = proofRequestResponse.data;
      const wallet = await this.getSovrinData(userId, this.paDataType.wallet);
      const proofResponse = await this.userImsApiService.getProofFromWallet(
        proofRequest,
        wallet,
      );
      const statusResponse = await this.programsApiService.includeMe(
        did,
        programId,
        proofResponse.data.proof,
      );
      await this.dataStorageService.post(userId, {
        type: this.paDataType.status,
        data: statusResponse.data.status,
      });
      console.log(statusResponse.data.status);
    }
  }

  private async getSovrinData(userId: number, type: string): Promise<any> {
    const data = await this.dataStorageService.get(userId, type);
    return JSON.parse(JSON.parse(data));
  }
}
