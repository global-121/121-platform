import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Observable } from 'rxjs';
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

  public selectedLanguage: Observable<string>;

  constructor(private languageService: LanguageService) {}

  async ngOnInit(): Promise<void> {
    if (!this.languageService) {
      return;
    }

    this.languages = this.languageService.getLanguages();
    this.selectedLanguage = this.languageService.currentLanguage$;
  }

  public selectLanguage(lang: string): void {
    this.languageService.changeLanguage(lang);
  }
}
