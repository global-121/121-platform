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
    this.programId = 1; // This needs to be retrieved from somewhere
  }

  public getPrefilledAnswersProgram() {
    this.storage.get('scannedDid').then(value => {
      this.programsService.getPrefilledAnswers(value, this.programId).subscribe(response => {
        this.answersProgram = response;
        this.verificationPostponed = false;
      });
    });
  }

  public postponeVerification() {
    this.verificationPostponed = true;
  }

  public issueIdentityCredential() {
    this.storage.get('scannedDid').then(value => {
      // DUMMY fix later
      // const credentialJson = {};
      // this.programsService.issueCredential(did, null, credentialJson).subscribe(response => {
      //   console.log('response: ', response);
      //   this.credentialIssued = true;
      // });
      this.programsService.deletePrefilledAnswers(value, this.programId).subscribe(response => {
        console.log('response: ', response);
        console.log('Program credential issued');
        this.programCredentialIssued = true;
        this.answersProgram = null;
        this.complete();
      });
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
