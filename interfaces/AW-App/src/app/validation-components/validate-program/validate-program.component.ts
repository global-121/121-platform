import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonContent } from '@ionic/angular';
import { ValidationComponents } from '../validation-components.enum';
import { SessionStorageService } from 'src/app/services/session-storage.service';
import {
  Program,
  AnswerType,
  ProgramAttribute,
} from 'src/app/models/program.model';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { PaDataAttribute } from 'src/app/models/pa-data.model';

@Component({
  selector: 'app-validate-program',
  templateUrl: './validate-program.component.html',
  styleUrls: ['./validate-program.component.scss'],
})
export class ValidateProgramComponent implements ValidationComponent {
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

  public ionicStorageTypes = IonicStorageTypes;

  constructor(
    public translatableString: TranslatableStringService,
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public sessionStorageService: SessionStorageService,
    public router: Router,
    public ionContent: IonContent,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    const paData = await this.getPaData();
    this.did = paData[0].did;
    this.programId = paData[0].programId;

    await this.getProgramQuestions();
    await this.initialAnswers(paData);

    this.verificationPostponed = false;
    this.ionContent.scrollToBottom(300);
  }

  private async getPaData(): Promise<PaDataAttribute[]> {
    const paDataRaw = await this.sessionStorageService.retrieve(
      this.sessionStorageService.type.paData,
    );
    return JSON.parse(paDataRaw);
  }

  private async getProgramQuestions() {
    this.currentProgram = await this.getCurrentProgram();
    this.questions = this.buildQuestions(this.currentProgram.customCriteria);
  }

  private async getCurrentProgram(): Promise<Program> {
    let program = await this.getCurrentProgramOffline(this.programId);
    if (!program) {
      program = await this.programsService.getProgramById(this.programId);
    }
    return program;
  }

  private async getCurrentProgramOffline(programId: number): Promise<Program> {
    const programs = await this.storage.get(this.ionicStorageTypes.myPrograms);
    if (programs) {
      for (const program of programs) {
        if (program.id === programId) {
          return program;
        }
      }
    }
  }

  private buildQuestions(customCriteria: Program['customCriteria']) {
    const questions = customCriteria.map((criterium) => {
      const question: Question = {
        id: criterium.id,
        code: criterium.criterium,
        answerType: criterium.answerType,
        label: this.translatableString.get(criterium.label),
        options: this.buildOptions(criterium.options),
      };
      return question;
    });

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
        label: this.translatableString.get(option.label),
      };
      options.push(questionOption);
    }
    return options;
  }

  private getQuestionByCode(questionCode: string): Question {
    const result = this.questions.find((question: Question) => {
      return question.code === questionCode;
    });

    return result;
  }

  private getAnswerOptionLabelByValue(
    options: QuestionOption[],
    answerValue: string,
  ) {
    const option = options.find((item: QuestionOption) => {
      return item.value === answerValue;
    });

    return option ? option.label : '';
  }

  public inputAnswers($event) {
    const questionCode = $event.target.name;
    this.answers[questionCode] = new Answer();
  }

  private buildAnswers(questionCode: string, answerValue: string) {
    const question = this.getQuestionByCode(questionCode);
    const answer: Answer = {
      code: questionCode,
      value: answerValue,
      label: answerValue,
    };

    // Convert the answerValue to a human-readable label
    if (question.answerType === AnswerType.Enum) {
      answer.label = this.getAnswerOptionLabelByValue(
        question.options,
        answerValue,
      );
    }

    this.answers[questionCode] = answer;
  }

  public changeAnswers($event) {
    const questionCode = $event.target.name;
    const answerValue = $event.target.value;

    this.buildAnswers(questionCode, answerValue);

    this.checkAllQuestionsAnswered(this.answers);
  }

  public initialAnswers(answers: PaDataAttribute[]) {
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

  public postponeVerification() {
    this.verificationPostponed = true;
  }

  private createAttributes(answers: Answer[]): ProgramAttribute[] {
    const attributes: ProgramAttribute[] = [];

    answers.forEach((item: Answer) => {
      attributes.push({
        attributeId: 0,
        attribute: item.code,
        answer: item.value,
      });
    });

    return attributes;
  }

  public async validateAttributes() {
    const attributes = this.createAttributes(Object.values(this.answers));
    await this.storeCredentialOffline(attributes);
    this.programCredentialIssued = true;
    this.answers = {};
    this.complete();
  }

  public async storeCredentialOffline(attributes: ProgramAttribute[]) {
    const credential = {
      did: this.did,
      programId: this.programId,
      attributes,
    };
    let storedCredentials = await this.storage.get(
      this.ionicStorageTypes.credentials,
    );
    if (!storedCredentials) {
      storedCredentials = [];
    }

    // If offline DID is already stored delete it from array first
    storedCredentials = storedCredentials.filter(
      (storedCredential) => !(storedCredential.did === this.did),
    );

    storedCredentials.push(credential);
    await this.storage.set(
      this.ionicStorageTypes.credentials,
      storedCredentials,
    );
  }

  getNextSection() {
    return ValidationComponents.mainMenu;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.validateProgram,
      data: {},
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
