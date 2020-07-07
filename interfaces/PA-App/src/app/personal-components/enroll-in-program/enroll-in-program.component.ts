import { Component, Input } from '@angular/core';
import {
  Program,
  ProgramAttribute,
  ProgramCriterium,
  ProgramCriteriumOption,
} from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SovrinService } from 'src/app/services/sovrin.service';
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
  private credDefId: string;

  public programDetails: any;

  public questions: Question[];
  public answerTypes = AnswerType;

  public answers: AnswerSet = {};

  public allQuestionsShown = false;
  public hasAnswered: boolean;
  public hasChangedAnswers: boolean;
  public dobFeedback = false;

  constructor(
    public programsService: ProgramsServiceApiService,
    public sovrinService: SovrinService,
    public paData: PaDataService,
    public translatableString: TranslatableStringService,
    public conversationService: ConversationService,
  ) {
    super();
  }

  ngOnInit() {
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

  initNew() {
    this.getProgramDetails();
  }

  private async getProgramDetails() {
    this.conversationService.startLoading();

    this.programId = Number(
      await this.paData.retrieve(this.paData.type.programId),
    );
    this.currentProgram = await this.programsService.getProgramById(
      this.programId,
    );
    this.prepareProgramDetails(this.currentProgram);
    this.paData.saveProgram(this.programId, this.currentProgram);

    this.conversationService.stopLoading();
  }

  public prepareProgramDetails(program: Program) {
    this.credDefId = program.credDefId;

    this.programDetails = this.buildDetails(program);
    this.questions = this.buildQuestions(program.customCriteria);
  }

  private buildDetails(response: Program) {
    const programDetails = [];
    const details = ['ngo', 'title', 'description'];
    for (const detail of details) {
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
          options: !criterium.options
            ? null
            : this.buildOptions(criterium.options),
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

  public changeAnswers() {
    this.hasAnswered = false;
    this.hasChangedAnswers = true;
  }

  public submit($event) {
    this.answers = $event;

    if (!this.answers.dob.value) {
      this.changeAnswers();
      this.dobFeedback = true;
      return;
    }

    this.hasAnswered = true;
    this.hasChangedAnswers = false;
    this.dobFeedback = false;
    this.conversationService.scrollToEnd();
    this.paData.saveAnswers(this.programId, this.answers);
  }

  public async submitConfirm() {
    this.conversationService.startLoading();
    this.isDisabled = true;
    await this.executeSovrinFlow();
    this.conversationService.stopLoading();
    this.complete();
  }

  private async executeSovrinFlow() {
    // 1. Get Credential Offer for programId
    const credentialOffer = await this.programsService.getCredentialOffer(
      this.programId,
    );

    // 2. Retrieve other necessary data from PA-account
    const wallet = await this.paData.retrieve(this.paData.type.wallet);
    const didShort = await this.paData.retrieve(this.paData.type.didShort);
    const did = await this.paData.retrieve(this.paData.type.did);

    // 3. Post Credential Request to create credential request in PA-app
    const credentialRequest = await this.sovrinService.createCredentialRequest(
      wallet,
      this.credDefId,
      credentialOffer.credOfferJsonData,
      didShort,
    );

    // 4. Post credential request to program-service
    await this.programsService.postCredentialRequest(
      did,
      this.programId,
      credentialRequest,
    );

    // 5. Form prefilled answers
    await this.programsService.postPrefilledAnswers(
      did,
      this.programId,
      'program',
      this.createAttributes(Object.values(this.answers)),
    );

    // 6. Store relevant data to PA-account
    this.paData.store(this.paData.type.credentialRequest, credentialRequest);
    this.paData.store(this.paData.type.credDefId, this.credDefId);
    this.paData.store(this.paData.type.programId, this.programId);
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

  getNextSection() {
    return PersonalComponents.selectFsp;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.enrollInProgram,
      data: {
        currentProgram: {
          id: this.currentProgram.id,
          ngo: this.currentProgram.ngo,
          title: this.currentProgram.title,
          description: this.currentProgram.description,
          customCriteria: this.currentProgram.customCriteria,
          credDefId: this.currentProgram.credDefId,
        },
        answers: this.answers,
      },
      next: this.getNextSection(),
    });
  }
}
