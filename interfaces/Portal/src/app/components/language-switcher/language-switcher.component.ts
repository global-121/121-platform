import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
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
  public languages: LanguageOption[];

  public selectedLanguage: string;

  constructor(private languageService: LanguageService) {}
  ngOnInit(): void {
    if (!this.languageService) {
      this.languages = [];
      return;
    }
    this.languages = this.languageService.getLanguages();

    this.selectedLanguage = this.languageService.getSelectedLanguage();
  }

  public selectLanguage($event) {
    this.languageService.changeLanguage($event.detail.value);
  }
}
