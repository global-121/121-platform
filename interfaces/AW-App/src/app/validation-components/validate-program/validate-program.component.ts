import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonContent } from '@ionic/angular';
import { ValidationComponents } from '../validation-components.enum';
import { SessionStorageService } from 'src/app/services/session-storage.service';

@Component({
  selector: 'app-validate-program',
  templateUrl: './validate-program.component.html',
  styleUrls: ['./validate-program.component.scss'],
})
export class ValidateProgramComponent implements ValidationComponent {

  public did: string;
  public programId: number;
  public answersProgram: any;
  public programCredentialIssued = false;
  public verificationPostponed = false;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public sessionStorageService: SessionStorageService,
    public storage: Storage,
    public router: Router,
    public ionContent: IonContent,
  ) { }

  ngOnInit() {
    this.sessionStorageService.retrieve(this.sessionStorageService.type.scannedDid).then(data => {
      console.log(data);
      const jsonData = JSON.parse(data);
      this.did = jsonData.did;
      this.programId = jsonData.programId;
      this.getPrefilledAnswersProgram();
      this.sessionStorageService.destroyItem(this.sessionStorageService.type.scannedDid);
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

  public async issueCredential() {
    await this.programsService.issueCredential(this.did, this.programId).subscribe(response => {
      console.log('response: ', response);
    });
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
    return ValidationComponents.mainMenu;
  }


  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.validateProgram,
      data: {
      },
      next: this.getNextSection(),
    });
  }

}
