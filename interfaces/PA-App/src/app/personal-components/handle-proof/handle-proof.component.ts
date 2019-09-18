import { StorageService } from './../../services/storage.service';
import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { UpdateService } from 'src/app/services/update.service';
import { PaAccountApiService } from 'src/app/services/pa-account-api.service';
import { UserImsApiService } from 'src/app/services/user-ims-api.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PersonalComponent } from '../personal-component.class';

enum InclusionStatusEnum {
  included = 'inlcluded',
  excluded = 'excluded',
  unavailable = 'unavailable'
}


@Component({
  selector: 'app-handle-proof',
  templateUrl: './handle-proof.component.html',
  styleUrls: ['./handle-proof.component.scss'],
})
export class HandleProofComponent extends PersonalComponent {

  public creatingProof = false;
  public inclusionStatusPositive = false;
  public inclusionStatusNegative = false;

  constructor(
    public storage: Storage,
    public updateService: UpdateService,
    public programService: ProgramsServiceApiService,
    public paAccountApiService: PaAccountApiService,
    public userImsApiService: UserImsApiService,
    public storageService: StorageService
  ) {
    super();
  }

  ngOnInit() {
    this.handleProof();
  }
  async handleProof() {
    console.log('handleProof');
    const proofRequest = await this.getProofRequest();
    const proof = await this.getProof(proofRequest);
    const status = await this.sendProof(proof);

    let inclusionStatus;
    if (status === 'done') {
      inclusionStatus = await this.getInclusionStatus();
    }
    if (inclusionStatus === InclusionStatusEnum.included) {
      this.inclusionStatusPositive = true;
    } else if (inclusionStatus === InclusionStatusEnum.excluded) {
      this.inclusionStatusNegative = true;
    }
  }

  async getProofRequest(): Promise<string> {
    console.log('getProofRequest');
    this.creatingProof = true;
    const programId = await this.storageService.retrieve(this.storageService.type.programId);
    return this.programService.getProofRequest(programId).toPromise();
  }

  async getProof(proofRequest: string): Promise<string> {
    console.log('getProof');
    const proofRequestJson = JSON.stringify(proofRequest);
    const wallet = JSON.parse(await this.storageService.retrieve(this.storageService.type.wallet));
    const correlation = JSON.parse(await this.storageService.retrieve(this.storageService.type.correlation));
    const generatedProof = await this.userImsApiService.getProofFromWallet(proofRequestJson, wallet, correlation).toPromise();
    const proof = generatedProof.proof;
    return proof;
  }

  async sendProof(proof: string): Promise<string> {
    console.log('sendProof');
    const did = await this.storageService.retrieve(this.storageService.type.did);
    const programId = Number(await this.storageService.retrieve(this.storageService.type.programId));
    const response = await this.programService.postIncludeMe(did, programId, proof).toPromise();
    return response.status;
  }

  async getInclusionStatus(): Promise<string> {
    console.log('getInclusionStatus');
    const did = await this.storageService.retrieve(this.storageService.type.did);
    const programId = await this.storageService.retrieve(this.storageService.type.programId);
    const response = await this.programService.postInclusionStatus(did, programId).toPromise();
    return response.status;
  }

}
