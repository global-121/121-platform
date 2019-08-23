import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-choose-credential-type',
  templateUrl: './choose-credential-type.component.html',
  styleUrls: ['./choose-credential-type.component.scss'],
})
export class ChooseCredentialTypeComponent implements OnInit {

  public credentialTypes: any;
  public credentialTypeChoice: number;
  public programChosen: boolean;
  public credentialTypeChoiceNew: number;

  constructor(
    public storage: Storage,
    public customTranslateService: CustomTranslateService
  ) { }

  ngOnInit() {
    this.credentialTypes = [
      { id: 1, credentialType: this.customTranslateService.translate('personal.choose-credential-type.option1'), disabled: false },
      { id: 2, credentialType: this.customTranslateService.translate('personal.choose-credential-type.option2'), disabled: false },
      { id: 3, credentialType: this.customTranslateService.translate('personal.choose-credential-type.option3'), disabled: true },
    ];
  }

  private storeCredentialType(credentialTypeChoice: any) {
    this.storage.set('credentialTypeChoice', credentialTypeChoice);
  }

  public changeCredentialType($event, iteration) {
    // tslint:disable: triple-equals
    if (iteration == 1) {
      const credentialTypeChoice = $event.detail.value;
      this.credentialTypeChoice = credentialTypeChoice;
      this.storeCredentialType(credentialTypeChoice);
    } else if (iteration == 2) {
      const credentialTypeChoiceNew = $event.detail.value;
      this.credentialTypeChoiceNew = credentialTypeChoiceNew;
      this.storeCredentialType(credentialTypeChoiceNew);
    }
  }

  public submitCredentialType() {
    // Here should be checked whether Digital ID already present
    if (this.credentialTypeChoice == 1) {
      this.programChosen = true;
    } else if (this.credentialTypeChoice == 2) {
      this.programChosen = false;
    }
    console.log('Chosen credential type: ', this.credentialTypeChoice);
  }

  public submitCredentialTypeNew() {
    console.log('Chosen credential type: ', this.credentialTypeChoiceNew);
  }



}
