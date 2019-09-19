import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';

import { Program } from 'src/app/models/program.model';
import { PaAccountApiService } from 'src/app/services/pa-account-api.service';
import { UserImsApiService } from 'src/app/services/user-ims-api.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-enroll-in-program',
  templateUrl: './enroll-in-program.component.html',
  styleUrls: ['./enroll-in-program.component.scss'],
})
export class EnrollInProgramComponent extends PersonalComponent {
  public languageCode: string;
  public fallbackLanguageCode: string;

  public program: any;
  public programTitle: string;

  private credDefId: string;
  private programId: number;

  public questions: Question[];
  public answerTypes = AnswerType;

  public answers: any = {};

  public allQuestionsShown = false;
  public hasAnswered: boolean;

  constructor(
    public programsService: ProgramsServiceApiService,
    public paAccountApiService: PaAccountApiService,
    public userImsApiService: UserImsApiService,
    public storageService: StorageService,
    public storage: Storage,
    public translate: TranslateService,
    public conversationService: ConversationService,
  ) {
    super();

    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.getLanguageChoice();
    this.getProgramDetails();
  }

  private getLanguageChoice() {
    this.storage.get('languageChoice').then(value => {
      this.languageCode = value;
    });
  }

  private getProgramDetails() {
    this.conversationService.startLoading();

    this.storage.get('programChoice').then(value => {
      this.getProgramDetailsById(value);
      this.programId = value;
    });
  }

  public getProgramDetailsById(programId: string) {
    this.programsService.getProgramById(programId).subscribe((response: Program) => {
      this.programTitle = this.mapLabelByLanguageCode(response.title);
      this.credDefId = response.credDefId;

      this.buildDetails(response);
      this.buildQuestions(response.customCriteria);

      this.conversationService.stopLoading();
    });
  }

  private buildDetails(response: Program) {
    const details = [
      'ngo',
      'description',
      'meetingDocuments',
    ];
    this.program = [];
    for (const detail of details) {
      let value = this.mapLabelByLanguageCode(response[detail]);

      if (typeof value === 'undefined') {
        value = response[detail];
      }

      if (detail === 'meetingDocuments') {
        value = this.buildDocumentsList(value);
      }

      this.program[detail] = value;
    }
  }

  private buildQuestions(customCriteria: Program['customCriteria']) {
    this.questions = [];

    for (const criterium of customCriteria) {
      const question: Question = {
        id: criterium.id,
        code: criterium.criterium,
        answerType: criterium.answerType,
        label: this.mapLabelByLanguageCode(criterium.label),
        options: this.buildOptions(criterium.options),
      };
      this.questions.push(question);
    }
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

  private buildDocumentsList(documents: string): string[] {
    return documents.split(';');
  }

  private mapLabelByLanguageCode(property: any) {
    let label = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
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

  public changeAnswers($event) {
    const questionCode = $event.target.name;
    const answerValue = $event.target.value;

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

    const answersArray = Object.keys(this.answers);

    if (answersArray.length === this.questions.length) {
      this.allQuestionsShown = true;
    } else {
      this.allQuestionsShown = false;
      this.showNextQuestion(answersArray.indexOf(questionCode));
    }
  }

  private showNextQuestion(currentIndex: number) {
    const initialTurns = 1; // Turns shown before the 'first question'-turn.
    const nextIndex = currentIndex + initialTurns + 1;

    this.showTurn(nextIndex);
  }

  public change() {
    this.hasAnswered = false;
  }

  public submit() {
    this.hasAnswered = true;
  }

  public async submitConfirm() {
    console.log('submitConfirm()');

    this.conversationService.startLoading();
    this.isDisabled = true;
    await this.executeSovrinFlow();
    this.conversationService.stopLoading();
    this.complete();
  }

  private async executeSovrinFlow() {

    // 1. Get Credential Offer for programId
    const credentialOffer = await this.programsService.getCredentialOffer(this.programId);

    // 2. Retrieve other necessary data from PA-account
    const wallet = await this.storageService.retrieve(this.storageService.type.wallet);
    const didShort = await this.storageService.retrieve(this.storageService.type.didShort);
    const did = await this.storageService.retrieve(this.storageService.type.did);

    // 3. Post Credential Request to create credential request in PA-app
    const credentialRequest = await this.userImsApiService.createCredentialRequest(
      JSON.parse(wallet),
      this.credDefId,
      credentialOffer.credOfferJsonData,
      didShort,
    );

    // 4. Post credential request to program-service
    await this.programsService.postCredentialRequest(
      did,
      this.programId,
      JSON.stringify(credentialRequest),
    );

    // 5. Form prefilled answers
    await this.programsService.postPrefilledAnswers(
      did,
      this.programId,
      'program',
      this.createAttributes(Object.values(this.answers)),
    );

    // 6. Store relevant data to PA-account
    this.storageService.store(this.storageService.type.credentialRequest, JSON.stringify(credentialRequest));
    this.storageService.store(this.storageService.type.credDefId, JSON.stringify(this.credDefId));
    this.storageService.store(this.storageService.type.programId, JSON.stringify(this.programId));
  }

  private createAttributes(answers: Answer[]): Attribute[] {
    const attributes = [];

    answers.forEach((item: Answer) => {
      attributes.push({
        attributeId: 0,
        attribute: item.code,
        answer: item.value,
      });
    });

    return attributes;
  }

  getNextSection() {
    return PersonalComponents.selectAppointment;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.enrollInProgram,
      data: {
        program: this.program,
        questions: this.questions,
        answers: this.answers,
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
class Attribute {
  attributeId: number;
  attribute: string;
  answer: string;
}
