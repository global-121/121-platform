import { Component, Input, OnInit } from '@angular/core';
import {
  Program,
  ProgramAttribute,
  ProgramQuestion,
  ProgramQuestionOption,
} from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import {
  Answer,
  AnswerSet,
  AnswerType,
  Question,
  QuestionOption,
} from '../../models/q-and-a.models';
import { PersonalDirective } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

export enum SubmitActions {
  confirm = 'confirm',
  change = 'change',
}

@Component({
  selector: 'app-enroll-in-program',
  templateUrl: './enroll-in-program.component.html',
  styleUrls: ['./enroll-in-program.component.scss'],
})
export class EnrollInProgramComponent
  extends PersonalDirective
  implements OnInit
{
  @Input()
  public data: any;

  private programId: number;
  private currentProgram: Program;

  public programDetails: any;

  public questions: Question[];
  public answerTypes = AnswerType;

  public answers: AnswerSet = {};

  public allQuestionsShown = false;
  public hasAnswered: boolean;
  public hasChangedAnswers: boolean;

  public submitActions = SubmitActions;
  public submitChoice: SubmitActions;

  constructor(
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public translatableString: TranslatableStringService,
    public conversationService: ConversationService,
  ) {
    super();
  }

  public ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }

    this.initNew();
  }

  initHistory() {
    this.isDisabled = true;
    this.submitChoice = this.submitActions.confirm;
    this.currentProgram = this.data.currentProgram;
    this.prepareProgramDetails(this.data.currentProgram);
    this.answers = this.data.answers;
    this.allQuestionsShown = true;
    this.hasAnswered = true;
    this.hasChangedAnswers = false;
  }

  async initNew() {
    this.conversationService.startLoading();
    await this.getProgramDetails();
    this.conversationService.stopLoading();
  }

  private async getProgramDetails() {
    this.currentProgram = await this.paData.getCurrentProgram();
    this.prepareProgramDetails(this.currentProgram);
  }

  public prepareProgramDetails(program: Program) {
    this.programId = program.id;

    this.programDetails = this.buildDetails(program);
    this.questions = this.buildQuestions(program.programQuestions);
  }

  private buildDetails(response: Program) {
    const programDetails = [];
    const details = ['titlePaApp', 'description', 'contactDetails'];
    for (const detail of details) {
      // Skip optional, non-existing program-properties
      if (!response[detail]) {
        continue;
      }
      programDetails[detail] = this.translatableString.get(response[detail]);
    }

    return programDetails;
  }

  private buildQuestions(programQuestions: ProgramQuestion[]) {
    return programQuestions
      .sort((a, b) => (a.id > b.id ? 1 : -1))
      .map((programQuestion): Question => {
        return {
          code: programQuestion.name,
          answerType: programQuestion.answerType,
          label: this.translatableString.get(programQuestion.label),
          placeholder: this.translatableString.get(programQuestion.placeholder),
          pattern: programQuestion.pattern,
          options: programQuestion.options
            ? this.buildOptions(programQuestion.options)
            : null,
        };
      });
  }

  private buildOptions(optionSet: ProgramQuestionOption[]): QuestionOption[] {
    return optionSet.map((option) => {
      return {
        value: option.option,
        label: this.translatableString.get(option.label),
      };
    });
  }

  public submit($event) {
    this.answers = $event;

    this.hasAnswered = true;
    this.hasChangedAnswers = false;
    this.paData.saveAnswers(this.programId, this.answers);
  }

  public doSubmitAction() {
    if (this.submitChoice === SubmitActions.change) {
      this.changeAnswers();
      return;
    }
    if (this.submitChoice === SubmitActions.confirm) {
      this.submitConfirm();
      return;
    }
  }

  public changeAnswers() {
    this.hasAnswered = false;
    this.hasChangedAnswers = true;
    this.conversationService.scrollToLastSection();
  }

  public async submitConfirm() {
    this.conversationService.startLoading();
    this.isDisabled = true;
    await this.postAnswers();
    await this.storePhoneNumber();
    this.conversationService.stopLoading();
    this.complete();
  }

  private async postAnswers() {
    const referenceId = await this.paData.getReferenceId();

    await this.programsService.postRegistrationCustomAttributes(
      this.createAttributes(Object.values(this.answers), referenceId),
      this.programId,
    );
  }

  private createAttributes(
    answers: Answer[],
    referenceId: string,
  ): ProgramAttribute[] {
    const attributes: ProgramAttribute[] = [];

    answers.forEach((item: Answer) => {
      attributes.push({
        key: item.code,
        value: item.value,
        referenceId,
      });
    });

    return attributes;
  }

  private async storePhoneNumber() {
    const phoneNumberAnswer = this.answers[this.paData.type.phoneNumber];

    if (phoneNumberAnswer) {
      return await this.paData.store(
        this.paData.type.phoneNumber,
        phoneNumberAnswer.value,
      );
    }
  }

  getNextSection() {
    return PersonalComponents.selectFsp;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.enrollInProgram,
      data: {
        currentProgram: {
          id: this.currentProgram.id,
          titlePaApp: this.currentProgram.titlePaApp,
          description: this.currentProgram.description,
          programQuestions: this.currentProgram.programQuestions,
        },
        answers: this.answers,
      },
      next: this.getNextSection(),
    });
  }
}
