import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonContent } from '@ionic/angular';
import { ValidationComponents } from '../validation-components.enum';
import { SessionStorageService } from 'src/app/services/session-storage.service';
import { Program } from 'src/app/models/program.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-validate-program',
  templateUrl: './validate-program.component.html',
  styleUrls: ['./validate-program.component.scss'],
})
export class ValidateProgramComponent implements ValidationComponent {

  public languageCode: string;
  public fallbackLanguageCode: string;

  public did: string;
  public programId: number;
  private currentProgram: Program;
  public programCredentialIssued = false;
  public verificationPostponed = false;

  public questions: Question[];
  public answerTypes = AnswerType;
  public answers: any = {};

  public allQuestionsAnswered = true;
  public hasAnswered: boolean;
  public changedAnswers: boolean;
  public dobFeedback = false;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public sessionStorageService: SessionStorageService,
    public storage: Storage,
    public router: Router,
    public ionContent: IonContent,
    public translate: TranslateService,
  ) { }

  ngOnInit() {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;

    this.sessionStorageService.retrieve(this.sessionStorageService.type.scannedDid).then(data => {
      const jsonData = JSON.parse(data);
      this.did = jsonData.did;
      this.programId = jsonData.programId;
      this.getProgramQuestionsAndAnswers();
      this.sessionStorageService.destroyItem(this.sessionStorageService.type.scannedDid);
    });
  }

  private async getProgramQuestionsAndAnswers() {
    this.currentProgram = await this.programsService.getProgramById(this.programId);
    await this.prepareProgramDetails(this.currentProgram);
    this.getPrefilledAnswersProgram();

  }

  public async prepareProgramDetails(program: Program) {
    this.questions = this.buildQuestions(program.customCriteria);
  }

  private buildQuestions(customCriteria: Program['customCriteria']) {
    const questions = [];

    for (const criterium of customCriteria) {
      const question: Question = {
        id: criterium.id,
        code: criterium.criterium,
        answerType: criterium.answerType,
        label: this.mapLabelByLanguageCode(criterium.label),
        options: this.buildOptions(criterium.options),
      };
      questions.push(question);
    }

    return questions;
  }

  private buildOptions(optionsRaw: any[]): QuestionOption[] {
    if (!optionsRaw) {
      return;
    }

    const options = [];

    for (const option of optionsRaw) {
      const questionOption: QuestionOption = {
        id: option.id,
        value: option.option,
        label: this.mapLabelByLanguageCode(option.label),
      };
      options.push(questionOption);
    }

    return options;
  }

  private mapLabelByLanguageCode(property: any) {
    let label = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
    }

    if (!label) {
      label = property;
    }

    return label;
  }

  private getQuestionByCode(questionCode: string): Question {
    const result = this.questions.find((question: Question) => {
      return question.code === questionCode;
    });

    return result;
  }

  private getAnswerOptionLabelByValue(options: QuestionOption[], answerValue: string) {
    const option = options.find((item: QuestionOption) => {
      return item.value === answerValue;
    });

    return option ? option.label : '';
  }

  public inputAnswers($event) {
    const questionCode = $event.target.name;
    this.answers[questionCode] = new Answer();
  }

  public async buildAnswers(questionCode: string, answerValue: string) {

    const question = this.getQuestionByCode(questionCode);
    const answer: Answer = {
      code: questionCode,
      value: answerValue,
      label: answerValue,
    };

    // Convert the answerValue to a human-readable label
    if (question.answerType === AnswerType.Enum) {
      answer.label = this.getAnswerOptionLabelByValue(question.options, answerValue);
    }

    this.answers[questionCode] = answer;

  }


  public async changeAnswers($event) {
    const questionCode = $event.target.name;
    const answerValue = $event.target.value;

    await this.buildAnswers(questionCode, answerValue);

    this.checkAllQuestionsAnswered(this.answers);

  }

  public initialAnswers(answers) {
    for (const answerItem of answers) {
      this.buildAnswers(answerItem.attribute, answerItem.answer);
    }
  }

  private checkAllQuestionsAnswered(answers) {
    for (const key in answers) {
      if (answers[key].value === '') {
        this.allQuestionsAnswered = false;
        return;
      }
    }
    this.allQuestionsAnswered = true;
  }

  public change() {
    this.hasAnswered = false;
    this.changedAnswers = true;
  }

  public submit() {
    if (!this.answers.dob) {
      this.dobFeedback = true;
      return;
    }
    this.hasAnswered = true;
    this.changedAnswers = false;
    this.dobFeedback = false;
  }

  public getPrefilledAnswersProgram() {
    this.programsService.getPrefilledAnswers(this.did, this.programId).subscribe(response => {
      this.initialAnswers(response);
      this.verificationPostponed = false;
      this.ionContent.scrollToBottom(300);
    });
  }

  public postponeVerification() {
    this.verificationPostponed = true;
  }

  public async issueCredential() {
    await this.programsService.issueCredential(this.did, this.programId).subscribe(response => {
      console.log('response: ', response);
    });
    this.programCredentialIssued = true;
    this.answers = {};
    this.resetParams();
    this.complete();
  }

  resetParams() {
    this.router.navigate([], {
      queryParams: {},
    });
  }

  getNextSection() {
    return ValidationComponents.mainMenu;
  }


  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.validateProgram,
      data: {
      },
      next: this.getNextSection(),
    });
  }

}


class Question {
  id: number;
  code: string;
  answerType: AnswerType;
  label: string;
  options: QuestionOption[];
}
enum AnswerType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown',
}
class QuestionOption {
  id: number;
  value: string;
  label: string;
}
class Answer {
  code: string;
  value: string;
  label: string;
}
