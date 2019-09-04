import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';

import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-enroll-in-program',
  templateUrl: './enroll-in-program.component.html',
  styleUrls: ['./enroll-in-program.component.scss'],
})
export class EnrollInProgramComponent implements PersonalComponent {
  public languageCode: string;

  public program: any;
  public programTitle: string;
  public introductionText: string;

  public questions: any;

  public hasAnswered: boolean;

  constructor(
    public programsService: ProgramsServiceApiService,
    public storage: Storage,
    public translate: TranslateService,
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {
    this.getLanguageChoice();
    this.getProgramDetails();
  }

  private getLanguageChoice() {
    this.storage.get('languageChoice').then(value => {
      this.languageCode = value;
    });
  }

  private getProgramDetails() {
    this.storage.get('programChoice').then(value => {
      this.getProgramDetailsById(value);
    });
  }

  public getProgramDetailsById(programId: string) {
    this.programsService.getProgramById(programId).subscribe((response: Program) => {

      this.programTitle = response.title[this.languageCode];
      this.introductionText = this.translate.instant('personal.enroll-in-program.introduction', {
        programTitle: this.programTitle,
      });

      this.buildDetails(response, this.languageCode);
      this.buildQuestions(response.customCriteria, this.languageCode);
    });
  }

  private buildDetails(response: Program, languageCode: string) {
    const details = [
      'description',
      'distributionChannel',
    ];
    this.program = [];
    for (const detail of details) {
      this.program[detail] = response[detail][languageCode] ? response[detail][languageCode] : response[detail];
    }
  }

  private buildQuestions(customCriteria, languageCode: string) {
    this.questions = [];

    for (const criterium of customCriteria) {
      this.questions.push({
        id: criterium.id,
        code: criterium.criterium,
        type: criterium.answerType,
        label: criterium.label[languageCode],
        options: this.buildOptions(criterium.options, languageCode),
      });
    }
    console.log('this.questions: ', this.questions);
  }

  private buildOptions(optionsRaw, languageCode: string) {
    if (!optionsRaw) {
      return;
    }

    const options = [];

    for (const option of optionsRaw) {
      options.push({
        id: option.id,
        key: option.option,
        label: option.label[languageCode],
      });
    }

    return options;
  }

  public change() {
    console.log('change()');

  }

  public submit() {
    console.log('submit()');

    this.hasAnswered = true;
  }

  public submitConfirm() {
    console.log('submitConfirm()');

    this.complete();
  }

  getNextSection() {
    return 'select-appointment';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'enroll-in-program',
      next: this.getNextSection(),
    });
  }
}
