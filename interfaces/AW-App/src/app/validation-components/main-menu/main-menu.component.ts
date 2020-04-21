import { Component } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';
import { Storage } from '@ionic/storage';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { Router } from '@angular/router';
import { ValidationComponents } from '../validation-components.enum';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
})
export class MainMenuComponent implements ValidationComponent {
  public menuOptions: any;
  public optionChoice: string;
  public optionSelected: boolean;

  constructor(
    public customTranslateService: CustomTranslateService,
    public storage: Storage,
    public conversationService: ConversationService,
    public router: Router,
  ) { }

  ngOnInit() {
    this.menuOptions = [
      { id: 'download-data', option: this.customTranslateService.translate('validation.main-menu.download-data'), disabled: false },
      { id: 'view-appointments', option: this.customTranslateService.translate('validation.main-menu.view-appointments'), disabled: false },
      { id: 'scan-qr', option: this.customTranslateService.translate('validation.main-menu.scan-qr'), disabled: false },
    ];
  }

  private storeOption(optionChoice: any) {
    this.storage.set('optionChoice', optionChoice);
  }

  public changeOption($event) {
    const optionChoice = $event.detail.value;
    this.optionChoice = optionChoice;
    this.storeOption(optionChoice);
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
