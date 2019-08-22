import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-select-language',
  templateUrl: './select-language.component.html',
  styleUrls: ['./select-language.component.scss'],
})
export class SelectLanguageComponent implements OnInit {
  public languages: any;
  public languageChoice: number;
  public languageChoiceName: string;

  constructor(
    public storage: Storage
  ) { }

  ngOnInit() {
    this.languages = [
      { id: 1, language: 'English' },
      { id: 2, language: 'Language 2' },
      { id: 3, language: 'Language 3' },
    ];
  }

  public getLanguageName(languageId: number): string {
    const language = this.languages.find(item => {
      return item.id === languageId;
    });

    return language ? language.language : '';
  }

  private setLanguageChoiceName(languageChoice: string) {
    const languageId = parseInt(languageChoice, 10);

    this.languageChoiceName = this.getLanguageName(languageId);
  }

  private storeLanguage(languageChoice: any) {
    this.storage.set('languageChoice', languageChoice);
  }

  public changeLanguage($event) {
    const languageChoice = $event.detail.value;
    this.languageChoice = languageChoice;
    this.storeLanguage(languageChoice);
    this.setLanguageChoiceName(languageChoice);
  }



}
