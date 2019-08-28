import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
})
export class MainMenuComponent implements OnInit {
  public menuOptions: any;
  public optionChoice: number;
  public optionSelected: boolean;

  constructor(
    public customTranslateService: CustomTranslateService,
    public storage: Storage
  ) { }

  ngOnInit() {
    this.menuOptions = [
      { id: 1, option: this.customTranslateService.translate('personal.main-menu.menu-option1'), disabled: false },
      { id: 2, option: this.customTranslateService.translate('personal.main-menu.menu-option2'), disabled: false },
      { id: 3, option: this.customTranslateService.translate('personal.main-menu.menu-option3'), disabled: true },
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
    console.log('optionChoice: ', this.optionChoice);
  }



}
