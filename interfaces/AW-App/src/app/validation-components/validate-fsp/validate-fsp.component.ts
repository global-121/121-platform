// import { Storage } from '@ionic/storage';
import { Component } from '@angular/core';
import { ValidationComponent } from '../validation-components.interface';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ConversationService } from 'src/app/services/conversation.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { ValidationComponents } from '../validation-components.enum';
import { PaDataAttribute } from 'src/app/models/pa-data.model';
import { FspAttribute, FspAttributeOption } from 'src/app/models/fsp.model';
import { Question, QuestionOption, AnswerSet, Answer } from 'src/app/models/q-and-a.models';

@Component({
  selector: 'app-validate-fsp',
  templateUrl: './validate-fsp.component.html',
  styleUrls: ['./validate-fsp.component.scss'],
})
export class ValidateFspComponent implements ValidationComponent {
  public did: string;
  public programId: number;

  public questions: Question[];
  public customAttributeAnswers: AnswerSet = {};
  public isSubmitted: boolean;
  public isEditing: boolean;
  public showResultSuccess: boolean;
  public showResultError: boolean;


  constructor(
    public translatableString: TranslatableStringService,
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public sessionStorageService: SessionStorageService,
    public router: Router,
    public ionContent: IonContent,
    // private storage: Storage,
  ) { }

  async ngOnInit() {
    const paData = await this.getPaData();
    this.did = paData[0].did;
    this.programId = paData[0].programId;

    const attributesAnswers =  await this.programsService.getFspAttributesAsnwers(this.did, this.programId)
    console.log('attributesAnswers: ', attributesAnswers);

    this.questions = this.buildQuestions(attributesAnswers.attributes);
    this.customAttributeAnswers = attributesAnswers.answers;
    console.log('this.customAttributeAnswers: ', this.customAttributeAnswers);

  }

  private async getPaData(): Promise<PaDataAttribute[]> {
    const paDataRaw = await this.sessionStorageService.retrieve(
      this.sessionStorageService.type.paData,
    );
    return JSON.parse(paDataRaw);
  }

  private buildQuestions(fspAttributes: FspAttribute[]) {
    return fspAttributes.map(
      (attribute): Question => {
        return {
          code: attribute.name,
          answerType: attribute.answerType,
          label: this.translatableString.get(attribute.label),
          options: !attribute.options
            ? null
            : this.buildOptions(attribute.options),
        };
      },
    );
  }

  private buildOptions(optionSet: FspAttributeOption[]): QuestionOption[] {
    return optionSet.map(
      (option): QuestionOption => {
        return {
          value: option.option,
          label: this.translatableString.get(option.label),
        };
      },
    );
  }
  private processInOrder(array: any[], fn) {
    return array.reduce(
      (request, item) => request.then(() => fn(item)),
      Promise.resolve(),
    );
  }

  public async saveCustomAttributes($event: AnswerSet) {
    this.conversationService.startLoading();
    this.customAttributeAnswers = $event;

    const fspAnswers = []

    this.showResultSuccess = null;
    this.showResultError = null;
    this.processInOrder(
      Object.values(this.customAttributeAnswers),
      (answer: Answer) =>
          fspAnswers.push({
            did: this.did,
            code: answer.code,
            value: answer.value,
          })
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
    this.storeFspAnswersOffline(fspAnswers);
  }

  public async storeFspAnswersOffline(answers: any) {
    console.log('storeFspAnswersOffline',  answers);
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
