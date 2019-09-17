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
    console.log('proof', proof);

  }

  async getProofRequest(): Promise<string> {
    console.log('getProofRequest');
    this.creatingProof = true;
    const programId = await this.paRetrieveData('programId');
    return this.programService.getProofRequest(programId).toPromise();
  }
  async getProof(proofRequest: string): Promise<object> {
    console.log('getting proof from wallet');
    const proofRequestJson = JSON.stringify(proofRequest)
    const wallet = JSON.parse(await this.paRetrieveData('wallet'));
    const correlation = JSON.parse(await this.paRetrieveData('correlation'));
    return this.userImsApiService.getProofFromWallet(proofRequestJson, wallet, correlation).toPromise();

  }

  async paRetrieveData(variableName: string): Promise<any> {
    return await this.paAccountApiService.retrieve(variableName)
      .toPromise();
  }
}
