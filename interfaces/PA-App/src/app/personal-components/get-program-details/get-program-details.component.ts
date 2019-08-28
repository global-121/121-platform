import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';

import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-get-program-details',
  templateUrl: './get-program-details.component.html',
  styleUrls: ['./get-program-details.component.scss'],
})
export class GetProgramDetailsComponent implements PersonalComponent {
  public languageCode: string;

  public program: any;
  public programTitle: string;
  public getProgramDetailsIntroduction: string;

  public wantsToEnrol = false;

  public questions: any;

  constructor(
    public programsService: ProgramsServiceApiService,
    public storage: Storage,
    public translate: TranslateService,
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {
    this.storage.get('languageChoice').then(value => {
      this.languageCode = value ? value : 'en';
    });

    this.getProgramDetails();
  }

  public getProgramDetails(): any {
    this.storage.get('programChoice').then(value => {
      this.getProgramDetailsById(value);
    });
  }

  public getProgramDetailsById(programId: string) {
    this.programsService.getProgramById(programId).subscribe((response: Program) => {

      this.programTitle = response.title[this.languageCode];
      this.getProgramDetailsIntroduction = this.translate.instant('personal.get-program-details.introduction', {
        programTitle: this.programTitle,
      });

      this.buildDetails(response);
      console.log(this.program);
      this.buildQuestions(response.customCriteria);
    });
  }

  private buildDetails(response: Program) {
    const details = [
      'description',
      'distributionChannel',
    ];
    this.program = [];
    for (const detail of details) {
      this.program.push({
        key: detail,
        value: response[detail][this.languageCode] ? response[detail][this.languageCode] : response[detail]
      });
    }
  }

  private buildQuestions(customCriteria) {
    this.questions = [];
    const languageCode = 'english';

    for (const criterium of customCriteria) {
      this.questions.push({
        id: criterium.id,
        code: criterium.criterium,
        type: criterium.answerType,
        label: criterium.label[languageCode],
        options: this.buildOptions(criterium.options),
      });
    }
    console.log('this.questions: ', this.questions);
  }

  private buildOptions(optionsRaw) {
    if (!optionsRaw) {
      return;
    }

    const options = [];

    for (const option of optionsRaw) {
      options.push({
        id: option.id,
        key: option.option,
        label: option.label.english,
      });
    }

    return options;
  }

  public enrolInProgram() {
    console.log('enrol!');

    this.complete();
  }

  getNextSection() {
    return 'select-appointment';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'get-program-details',
      next: this.getNextSection(),
    });
  }
}
