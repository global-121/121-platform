import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';
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

  private ionicStorageTypes = IonicStorageTypes;

  constructor(
    public translate: TranslateService,
    public conversationService: ConversationService,
    public router: Router,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    const pendingUploadCount = await this.getNrUploadWaiting();
    this.menuOptions = [
      {
        id: ValidationComponents.downloadData,
        option: this.translate.instant('validation.main-menu.download-data'),
        disabled: false,
      },
      {
        id: ValidationComponents.scanQr,
        option: this.translate.instant('validation.main-menu.scan-qr'),
        disabled: false,
      },
      {
        id: ValidationComponents.uploadData,
        option: this.translate.instant('validation.main-menu.upload-data'),
        counter: pendingUploadCount,
        disabled: !pendingUploadCount,
      },
    ];
  }

  private async getNrUploadWaiting() {
    const credentials = await this.storage.get(
      this.ionicStorageTypes.credentials,
    );
    return credentials ? credentials.length : 0;
  }

  public changeOption($event) {
    const optionChoice = $event.detail.value;
    this.optionChoice = optionChoice;
  }

  public submitOption() {
    this.optionSelected = true;
    this.complete();
  }

  getNextSection() {
    return this.optionChoice;
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
