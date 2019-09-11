import { Component } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { PersonalComponent } from '../personal-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-validate-program',
  templateUrl: './validate-program.component.html',
  styleUrls: ['./validate-program.component.scss'],
})
export class ValidateProgramComponent implements PersonalComponent {

  public did: string;
  public programId: number;
  public answersProgram: any;
  public programCredentialIssued = false;
  public verificationPostponed = false;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public storage: Storage
  ) { }

  ngOnInit() {
    this.storage.get('scannedDid').then(did => {
      this.storage.get('scannedProgramId').then(programId => {
        this.did = did;
        this.programId = programId;
      });
    });
  }

  public getPrefilledAnswersProgram() {
    this.programsService.getPrefilledAnswers(this.did, this.programId).subscribe(response => {
      this.answersProgram = response;
      this.verificationPostponed = false;
    });
  }

  public postponeVerification() {
    this.verificationPostponed = true;
  }

  public async issueIdentityCredential() {
    // this.storage.get('scannedDid').then(did => {
    //   this.storage.get('scannedProgramId').then(programId => {
    await this.programsService.issueCredential(this.did, this.programId).subscribe(response => {
      console.log('response: ', response);
    });
    this.programsService.deletePrefilledAnswers(this.did, this.programId).subscribe(response => {
      console.log('response: ', response);
      this.programCredentialIssued = true;
      this.answersProgram = null;
      this.complete();
    });
    //   });
    // });
  }

  getNextSection() {
    return 'main-menu';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'validate-program',
      data: {
      },
      next: this.getNextSection(),
    });
  }

}
