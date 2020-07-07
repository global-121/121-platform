import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { ConversationService } from 'src/app/services/conversation.service';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
})
export class MainMenuComponent implements ValidationComponent {
  public menuOptions: any;
  public optionChoice: string;
  public optionSelected: boolean;

  public ionicStorageTypes = IonicStorageTypes;

  constructor(
    public customTranslateService: CustomTranslateService,
    public conversationService: ConversationService,
    public router: Router,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    this.menuOptions = [
      {
        id: 'download-data',
        option: this.customTranslateService.translate(
          'validation.main-menu.download-data',
        ),
        disabled: false,
      },
      {
        id: 'view-appointments',
        option: this.customTranslateService.translate(
          'validation.main-menu.view-appointments',
        ),
        disabled: false,
      },
      {
        id: 'scan-qr',
        option: this.customTranslateService.translate(
          'validation.main-menu.scan-qr',
        ),
        disabled: false,
      },
      {
        id: 'upload-data',
        option: this.customTranslateService.translate(
          'validation.main-menu.upload-data',
        ), // + (await this.getNrUploadWaitingString()),
        counter: await this.getNrUploadWaiting(),
        disabled: false,
      },
    ];
  }

  private async getNrUploadWaiting() {
    const credentials = await this.storage.get(
      this.ionicStorageTypes.credentials,
    );
    if (credentials) {
      return credentials.length;
    } else {
      return 0;
    }
  }

  public changeOption($event) {
    const optionChoice = $event.detail.value;
    this.optionChoice = optionChoice;
  }

  public submitOption() {
    this.optionSelected = true;
    this.complete();
    console.log('optionChoice: ', this.optionChoice);
  }

  getNextSection() {
    if (this.optionChoice === 'download-data') {
      return ValidationComponents.downloadData;
    } else if (this.optionChoice === 'view-appointments') {
      return ValidationComponents.viewAppointments;
    } else if (this.optionChoice === 'scan-qr') {
      return ValidationComponents.scanQr;
    } else if (this.optionChoice === 'upload-data') {
      return ValidationComponents.uploadData;
    }
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.mainMenu,
      data: {
        option: this.optionChoice,
      },
      next: this.getNextSection(),
    });
  }
}
