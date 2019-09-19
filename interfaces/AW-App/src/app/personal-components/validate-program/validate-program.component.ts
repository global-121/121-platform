import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { PersonalComponent } from '../personal-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonContent } from '@ionic/angular';

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
    public storage: Storage,
    public router: Router,
    public ionContent: IonContent,
  ) { }

  ngOnInit() {
    this.storage.get('scannedDid').then(did => {
      this.storage.get('scannedProgramId').then(programId => {
        this.did = did;
        this.programId = programId;
        this.getPrefilledAnswersProgram();
      });
    });
  }

  public getPrefilledAnswersProgram() {
    this.programsService.getPrefilledAnswers(this.did, this.programId).subscribe(response => {
      this.answersProgram = response;
      this.verificationPostponed = false;
      this.ionContent.scrollToBottom(300);
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
    // this.programsService.deletePrefilledAnswers(this.did, this.programId).subscribe(response => {
    //   console.log('response: ', response);
    //   this.programCredentialIssued = true;
    //   this.answersProgram = null;
    //   this.complete();
    // });
    this.programCredentialIssued = true;
    this.answersProgram = null;
    this.resetParams();
    this.complete();
  }

  resetParams() {
    this.router.navigate([], {
      queryParams: {},
    });
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
