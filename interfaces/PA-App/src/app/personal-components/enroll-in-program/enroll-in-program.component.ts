import { Component, Input } from '@angular/core';
import { InstanceInformation } from 'src/app/models/instance.model';
import {
  Program,
  ProgramAttribute,
  ProgramCriterium,
  ProgramCriteriumOption,
} from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';
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
import { PersonalComponent } from '../personal-component.class';
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
export class EnrollInProgramComponent extends PersonalComponent {
  @Input()
  public data: any;

  private programId: number;
  private currentProgram: Program;

  public programDetails: any;
  public instanceInformation: InstanceInformation;

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
    private instanceService: InstanceService,
  ) {
    super();
  }

  ngOnInit() {
    this.getInstanceInformation();

    if (this.data) {
      this.initHistory();
      return;
    }

    this.initNew();
  }

  initHistory() {
    this.isDisabled = true;
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

  private async getInstanceInformation() {
    this.instanceService.instanceInformation.subscribe(
      (instanceInformation) => {
        this.instanceInformation = instanceInformation;
      },
    );
  }

  private async getProgramDetails() {
    this.currentProgram = await this.paData.getCurrentProgram();
    this.prepareProgramDetails(this.currentProgram);
  }

  public prepareProgramDetails(program: Program) {
    this.programId = program.id;

    this.programDetails = this.buildDetails(program);
    this.questions = this.buildQuestions(program.customCriteria);
  }

  private buildDetails(response: Program) {
    const programDetails = [];
    const details = ['title', 'description', 'contactDetails'];
    for (const detail of details) {
      // Skip optional, non-existing program-properties
      if (!response[detail]) {
        continue;
      }
      programDetails[detail] = this.translatableString.get(response[detail]);
    }

    return programDetails;
  }

  private buildQuestions(customCriteria: ProgramCriterium[]) {
    return customCriteria.map(
      (criterium): Question => {
        return {
          code: criterium.criterium,
          answerType: criterium.answerType,
          label: this.translatableString.get(criterium.label),
          placeholder: this.translatableString.get(criterium.placeholder),
          pattern: criterium.pattern,
          options: criterium.options
            ? this.buildOptions(criterium.options)
            : null,
        };
      },
    );
  }

  private buildOptions(optionSet: ProgramCriteriumOption[]): QuestionOption[] {
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
    const did = await this.paData.retrieve(this.paData.type.did);

    await this.programsService.postPrefilledAnswers(
      did,
      this.programId,
      'program',
      this.createAttributes(Object.values(this.answers)),
    );
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
          title: this.currentProgram.title,
          description: this.currentProgram.description,
          customCriteria: this.currentProgram.customCriteria,
        },
        answers: this.answers,
      },
      next: this.getNextSection(),
    });
  }
}
