import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { UpdateService } from 'src/app/services/update.service';
import { PaAccountApiService } from 'src/app/services/pa-account-api.service';
import { UserImsApiService } from 'src/app/services/user-ims-api.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { resolve } from 'url';

@Component({
  selector: 'app-handle-proof',
  templateUrl: './handle-proof.component.html',
  styleUrls: ['./handle-proof.component.scss'],
})
export class HandleProofComponent implements OnInit {

  public creatingProof = false;
  public inclusionStatusPositive = false;
  public inclusionStatusNegative = false;

  constructor(
    public storage: Storage,
    public updateService: UpdateService,
    public programService: ProgramsServiceApiService,
    public paAccountApiService: PaAccountApiService,
    public userImsApiService: UserImsApiService,
  ) { }

  ngOnInit() {
    console.log('onint');
    this.handleProof();
  }
  async handleProof() {
    const proofRequest = await this.getProofRequest();
    console.log('proofRequest', proofRequest);
    const proof = await this.getProof(proofRequest);
    const status = await this.sendProof(proof);
    let inclusionStatus;
    if (status === 'done') {
      inclusionStatus = await this.getInclusionStatus();
    }
    if (inclusionStatus === 'included') {
      console.log('jeuj');
      this.inclusionStatusPositive = true;
    } else if (inclusionStatus === 'excluded') {
      this.inclusionStatusNegative = true;
      console.log('nooh');
    }

  }

  async getProofRequest(): Promise<string> {
    console.log('getProofRequest');
    this.creatingProof = true;
    const programId = await this.paRetrieveData('programId');
    return this.programService.getProofRequest(programId).toPromise();
  }

  async getProof(proofRequest: string): Promise<string> {
    console.log('getting proof from wallet');
    const proofRequestJson = JSON.stringify(proofRequest);
    const wallet = JSON.parse(await this.paRetrieveData('wallet'));
    const correlation = JSON.parse(await this.paRetrieveData('correlation'));
    const generatedProof = await this.userImsApiService.getProofFromWallet(proofRequestJson, wallet, correlation).toPromise();
    const proof = generatedProof.proof;
    return proof;
  }

  async sendProof(proof: string): Promise<string> {
    const did = await this.paRetrieveData('did');
    const programId = Number(await this.paRetrieveData('programId'));
    console.log('sending', proof, did, programId);
    const response = await this.programService.postIncludeMe(did, programId, proof).toPromise();
    return response.status;
  }

  async getInclusionStatus(): Promise<string> {
    const did = await this.paRetrieveData('did');
    const programId = await this.paRetrieveData('programId');
    const response = await this.programService.postInclusionStatus(did, programId).toPromise();
    console.log('Inclusie status', response);
    return response.status;
  }

  async paRetrieveData(variableName: string): Promise<any> {
    return await this.paAccountApiService.retrieve(variableName)
      .toPromise();
  }
}
