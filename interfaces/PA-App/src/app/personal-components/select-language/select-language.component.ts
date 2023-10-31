import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';
import { environment } from 'src/environments/environment';
import { QueryParametersService } from '../../services/query-parameters.service';
import { PersonalDirective } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

const union = (...arr) => [...new Set(arr.flat(2))];

class LanguageOption {
  id: string;
  languageKey: string;
  language: string;
  introductionKey: string;
  introduction: string;
}

@Component({
  selector: 'app-select-language',
  templateUrl: './select-language.component.html',
  styleUrls: ['./select-language.component.scss'],
})
export class SelectLanguageComponent
  extends PersonalDirective
  implements OnInit
{
  @Input()
  public override data: any;

  public languages: LanguageOption[];
  public languageChoice: string;
  public languageChoiceName: string;

  public DEFAULT_LANGUAGES = ['en'];

  constructor(
    public conversationService: ConversationService,
    public paData: PaDataService,
    public translate: TranslateService,
    private logger: LoggingService,
    private queryParametersService: QueryParametersService,
  ) {
    super();
  }

  public async ngOnInit() {
    this.languages = await this.getEnabledLanguages();

    if (this.data) {
      this.initHistory();
    }
  }

  override async initHistory() {
    this.languageChoice = this.data.languageChoice;
    this.languageChoiceName = this.getLanguageName(this.data.languageChoice);
    await this.translate.use(this.languageChoice).toPromise();
    this.isDisabled = true;
  }

  private async getEnabledLanguages(): Promise<LanguageOption[]> {
    const allLocales = environment.locales.trim().split(/\s*,\s*/);
    const allProgramLanguages = await this.getAllProgramLanguages();
    const enabledLocales = allLocales.filter((locale) =>
      allProgramLanguages.includes(locale),
    );

    return enabledLocales.map((locale: string) => {
      const languageKey = `personal.select-language.language.${locale}`;
      const introductionKey = `personal.select-language.introduction.${locale}`;
      return {
        id: locale,
        languageKey,
        language: this.translate.instant(languageKey),
        introductionKey,
        introduction: this.translate.instant(introductionKey),
      };
    });
  }

  private async getAllProgramLanguages(): Promise<string[]> {
    const programIdsToFilter =
      await this.queryParametersService.getProgramIds();
    const programs = await this.paData.getAllPrograms(programIdsToFilter);

    if (programs.length === 0) {
      return this.DEFAULT_LANGUAGES;
    }

    return union(programs.map((p) => p.languages));
  }

  public getLanguageName(languageId: string): string {
    const language = this.languages.find((item) => {
      return item.id === languageId;
    });

    return language ? language.language : '';
  }

  public changeLanguage($event) {
    this.languageChoice = $event.detail.value;
    if (this.isDisabled) {
      return;
    }

    this.translate.use(this.languageChoice);
    this.languageChoiceName = this.getLanguageName(this.languageChoice);
  }

  public submitLanguage() {
    this.complete();
    this.logger.logEvent(
      LoggingEventCategory.input,
      LoggingEvent.languageChosen,
      {
        name: this.languageChoice,
      },
    );
  }

  getNextSection() {
    return PersonalComponents.contactDetails;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectLanguage,
      data: {
        languageChoice: this.languageChoice,
      },
      next: this.getNextSection(),
    });
  }
}
