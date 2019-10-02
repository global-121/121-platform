import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';
import { Storage } from '@ionic/storage';
import { PersonalComponent } from '../personal-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
})
export class MainMenuComponent implements PersonalComponent {
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
    this.resetParams();
    this.menuOptions = [
      { id: 'view-appointments', option: this.customTranslateService.translate('personal.main-menu.menu-option1'), disabled: true },
      { id: 'scan-qr', option: this.customTranslateService.translate('personal.main-menu.menu-option2'), disabled: false },
    ];
  }

  resetParams() {
    this.router.navigate([], {
      queryParams: {},
    });
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
    return this.optionChoice;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'main-menu',
      data: {
        option: this.optionChoice,
      },
      next: this.getNextSection(),
    });
  }

}
