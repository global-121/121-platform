import { Component, Input } from '@angular/core';
import { Fsp, FspQuestion, FspQuestionOption } from 'src/app/models/fsp.model';
import { Program } from 'src/app/models/program.model';
import {
  Answer,
  AnswerSet,
  Question,
  QuestionOption,
} from 'src/app/models/q-and-a.models';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { PersonalDirective } from '../personal-component.class';

@Component({
  selector: 'app-select-fsp',
  templateUrl: './select-fsp.component.html',
  styleUrls: ['./select-fsp.component.scss'],
})
export class SelectFspComponent extends PersonalDirective {
  @Input()
  public data: any;

  private referenceId: string;
  public program: Program;
  public fsps: Fsp[];

  public fspChoice: number;
  public chosenFsp: Fsp;
  public fspSubmitted: boolean;

  public questions: Question[];
  public customAttributeAnswers: AnswerSet = {};
  public isSubmitted: boolean;
  public isEditing: boolean;
  public showResultSuccess: boolean;
  public showResultError: boolean;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public translatableString: TranslatableStringService,
  ) {
    super();
  }

  async ngOnInit() {
    this.program = await this.paData.getCurrentProgram();

    if (this.data) {
      this.initHistory();
      return;
    }

    this.initNew();
  }

  async initNew() {
    this.conversationService.startLoading();
    this.fsps = this.program.financialServiceProviders;
    this.fsps.forEach(
      (fsp) =>
        (fsp.fspDisplayName = this.translatableString.get(fsp.fspDisplayName)),
    );
    this.referenceId = await this.paData.retrieve(this.paData.type.referenceId);
    this.conversationService.stopLoading();
  }

  async initHistory() {
    this.isDisabled = true;
    this.fspSubmitted = true;
    this.chosenFsp = this.data.fsp;
    this.fspChoice = this.data.fsp.id;
    this.fsps = [this.data.fsp];
    this.questions = this.buildQuestions(this.chosenFsp.questions);
    this.customAttributeAnswers = this.data.customAttributeAnswers;
    this.isSubmitted = true;
  }

  private getFspById(fspId: number) {
    return this.fsps.find((item: Fsp) => item.id === fspId);
  }

  public changeFsp($event) {
    if (this.isDisabled) {
      return;
    }

    this.fspChoice = parseInt($event.detail.value, 10);
    this.fspSubmitted = false;

    this.chosenFsp = this.getFspById(this.fspChoice);
    this.paData.store(this.paData.type.fsp, this.chosenFsp);
  }

  public async submitFsp() {
    this.fspSubmitted = true;

    this.programsService.postFsp(this.referenceId, this.fspChoice).then(
      async () => {
        // Update FSPs with more details:
        this.chosenFsp = await this.paData.getFspById(this.fspChoice);
        this.chosenFsp.fspDisplayName = this.translatableString.get(
          this.chosenFsp.fspDisplayName,
        );

        if (!this.chosenFsp.questions.length) {
          return this.complete();
        }

        this.questions = this.buildQuestions(this.chosenFsp.questions);
      },
      (error) => console.log('error', error),
    );
  }

  private buildQuestions(fspAttributes: FspQuestion[]) {
    return fspAttributes
      .sort((a, b) => (a.id > b.id ? 1 : -1))
      .map((attribute): Question => {
        return {
          code: attribute.name,
          answerType: attribute.answerType,
          label: this.translatableString.get(attribute.label),
          placeholder: this.translatableString.get(attribute.placeholder),
          options: !attribute.options
            ? null
            : this.buildOptions(attribute.options),
        };
      });
  }

  private buildOptions(optionSet: FspQuestionOption[]): QuestionOption[] {
    return optionSet.map((option): QuestionOption => {
      return {
        value: option.option,
        label: this.translatableString.get(option.label),
      };
    });
  }

  private processInOrder(array: any[], fn) {
    return array.reduce(
      (request, item) => request.then(() => fn(item)),
      Promise.resolve(),
    );
  }

  public async submitCustomAttributes($event: AnswerSet) {
    this.conversationService.startLoading();
    this.customAttributeAnswers = $event;

    this.showResultSuccess = null;
    this.showResultError = null;

    // Treat phoneNumber as a special case, to enable reuse later:
    await this.storePhoneNumber();

    this.processInOrder(
      Object.values(this.customAttributeAnswers),
      (answer: Answer) =>
        this.programsService.postRegistrationCustomAttribute(
          this.referenceId,
          answer.code,
          answer.value,
        ),
    )
      .then(
        () => {
          // in case of success:
          this.isSubmitted = true;
          this.isEditing = false;
          this.showResultSuccess = true;
          this.showResultError = false;
          this.complete();
        },
        () => {
          // in case of error:
          this.isSubmitted = false;
          this.isEditing = true;
          this.showResultSuccess = false;
          this.showResultError = true;
        },
      )
      .finally(() => {
        this.conversationService.stopLoading();
      });
  }

  private async storePhoneNumber() {
    const phoneNumberAnswer =
      this.customAttributeAnswers[this.paData.type.phoneNumber];

    if (phoneNumberAnswer) {
      return await this.paData.store(
        this.paData.type.phoneNumber,
        phoneNumberAnswer.value,
      );
    }
  }

  getNextSection() {
    return PersonalComponents.setNotificationNumber;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectFsp,
      data: {
        fsp: this.chosenFsp,
        customAttributeAnswers: this.customAttributeAnswers,
      },
      next: this.getNextSection(),
    });
  }
}
