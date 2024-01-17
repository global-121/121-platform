import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  LanguageOption,
  LanguageService,
} from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class LanguageSwitcherComponent implements OnInit {
  public languages: LanguageOption[] = [];

  public selectedLanguage: string;

  constructor(
    private languageService: LanguageService,
    private translate: TranslateService,
  ) {
    this.translate.onLangChange.subscribe((event: { lang: string }) => {
      this.selectedLanguage = event.lang;
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.languageService) {
      return;
    }

    this.languages = this.languageService.getLanguages();
    this.selectedLanguage = this.translate.currentLang;
  }

  public selectLanguage(lang: string): void {
    this.languageService.changeLanguage(lang);
  }
}
