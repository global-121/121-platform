import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TimeoutError } from 'rxjs';
import { FspAttribute, FspAttributeOption } from 'src/app/models/fsp.model';
import { FspAnswer, Registration } from 'src/app/models/pa-data.model';
import {
  Answer,
  AnswerSet,
  Question,
  QuestionOption,
} from 'src/app/models/q-and-a.models';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

@Component({
  selector: 'app-validate-fsp',
  templateUrl: './validate-fsp.component.html',
  styleUrls: ['./validate-fsp.component.scss'],
})
export class ValidateFspComponent implements ValidationComponent {
  public referenceId: string;
  public programId: number;

  public questions: Question[];
  public customAttributeAnswers: AnswerSet = {};
  public isSubmitted: boolean;
  public isEditing = true;
  public showResultSuccess: boolean;
  public showResultError: boolean;

  public fspQuestionAvailable = true;
  public backToMainMenu = false;

  constructor(
    public translatableString: TranslatableStringService,
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public router: Router,
    public ionContent: IonContent,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    const paData = this.getPaData();

    if (!paData) {
      return;
    }

    this.referenceId = paData.referenceId;
    this.programId = paData.program.id;

    const attributesAnswers = await this.findFspAnswers();
    if (
      attributesAnswers &&
      attributesAnswers.attributes &&
      attributesAnswers.attributes.length > 0
    ) {
      this.questions = this.buildQuestions(attributesAnswers.attributes);
      this.customAttributeAnswers = attributesAnswers.answers;
    } else {
      this.fspQuestionAvailable = false;
      this.backToMainMenu = true;
    }
  }

  private getPaData(): Registration | null {
    const paDataRaw = window.sessionStorage.getItem('paData');
    try {
      return JSON.parse(paDataRaw);
    } catch (error) {
      return null;
    }
  }

  private async findFspAnswers(): Promise<any> {
    let fspAnswers = await this.findFspAnswersOffline(this.referenceId);
    if (!fspAnswers) {
      fspAnswers = await this.findFspAnswersOnline(
        this.referenceId,
        this.programId,
      );
    }
    return fspAnswers;
  }

  private async findFspAnswersOffline(referenceId: string) {
    const offlineData = await this.storage.get(
      IonicStorageTypes.validationFspData,
    );
    if (!offlineData || !offlineData.length) {
      return offlineData;
    }
    for (const fspPaData of offlineData) {
      if (fspPaData.referenceId === referenceId) {
        return fspPaData;
      }
    }
  }

  private async findFspAnswersOnline(referenceId: string, programId: number) {
    try {
      const response = await this.programsService.getFspAttributesAsnwers(
        referenceId,
        programId,
      );
      if (response.length === 0) {
        return;
      }
      return response;
    } catch (e) {
      console.log('Error: ', e.name);
      if (e.status === 0 || e instanceof TimeoutError) {
        return;
      }
    }
  }

  private buildQuestions(fspAttributes: FspAttribute[]) {
    return fspAttributes.map((attribute): Question => {
      return {
        name: attribute.name,
        answerType: attribute.answerType,
        label: this.translatableString.get(attribute.label),
        options: !attribute.options
          ? null
          : this.buildOptions(attribute.options),
      };
    });
  }

  private buildOptions(optionSet: FspAttributeOption[]): QuestionOption[] {
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

  public async saveCustomAttributes($event: AnswerSet) {
    this.conversationService.startLoading();
    this.customAttributeAnswers = $event;

    const fspAnswers: FspAnswer[] = [];

    this.showResultSuccess = null;
    this.showResultError = null;
    this.processInOrder(
      Object.values(this.customAttributeAnswers),
      (answer: Answer) =>
        fspAnswers.push({
          referenceId: this.referenceId,
          code: answer.name,
          value: answer.value,
        }),
    )
      .then(
        () => {
          // in case of success:
          this.isSubmitted = true;
          this.isEditing = false;
          this.showResultSuccess = true;
          this.showResultError = false;
          this.backToMainMenu = true;
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

  public async storeFspAnswersOffline(fspanswers: any) {
    let validatedData = await this.storage.get(IonicStorageTypes.validatedData);
    if (!validatedData) {
      validatedData = [];
    }
    // If data was already stored update object else create new object
    const currentIndex = validatedData.findIndex(
      (obj) => obj.referenceId === this.referenceId,
    );
    if (currentIndex || currentIndex === 0) {
      validatedData[currentIndex].fspanswers = fspanswers;
    } else {
      const validatedFspData = {
        referenceId: this.referenceId,
        programId: this.programId,
        fspanswers,
      };
      validatedData.push(validatedFspData);
    }
    await this.storage.set(IonicStorageTypes.validatedData, validatedData);
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
