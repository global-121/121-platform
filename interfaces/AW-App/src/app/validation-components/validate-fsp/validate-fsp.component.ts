import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TimeoutError } from 'rxjs';
import { FspAttribute, FspAttributeOption } from 'src/app/models/fsp.model';
import { PaDataAttribute } from 'src/app/models/pa-data.model';
import {
  Answer,
  AnswerSet,
  Question,
  QuestionOption,
} from 'src/app/models/q-and-a.models';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

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
  public isEditing = true;
  public showResultSuccess: boolean;
  public showResultError: boolean;

  public fspQuestionAvailable = true;
  public backToMainMenu = false;

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
      console.log('this.fspQuestionAvailable : ', this.fspQuestionAvailable);
    }
  }

  private async getPaData(): Promise<PaDataAttribute[]> {
    const paDataRaw = await this.sessionStorageService.retrieve(
      this.sessionStorageService.type.paData,
    );
    return JSON.parse(paDataRaw);
  }

  private async findFspAnswers(): Promise<any> {
    let fspAnswers = await this.findFspAnswersOffline(this.did);
    if (!fspAnswers) {
      fspAnswers = await this.findFspAnswersOnline(this.did, this.programId);
    }
    console.log('fspAnswers: ', fspAnswers);
    return fspAnswers;
  }

  private async findFspAnswersOffline(did: string) {
    console.log('findFspAnswersOffline()');
    const offlineData = await this.storage.get(
      IonicStorageTypes.validationFspData,
    );
    if (!offlineData || !offlineData.length) {
      return offlineData;
    }
    for (const fspPaData of offlineData) {
      if (fspPaData.did === did) {
        return fspPaData;
      }
    }
  }

  private async findFspAnswersOnline(did: string, programId: number) {
    try {
      const response = await this.programsService.getFspAttributesAsnwers(
        did,
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

    const fspAnswers = [];

    this.showResultSuccess = null;
    this.showResultError = null;
    this.processInOrder(
      Object.values(this.customAttributeAnswers),
      (answer: Answer) =>
        fspAnswers.push({
          did: this.did,
          code: answer.code,
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
    let storedCredentials = await this.storage.get(
      IonicStorageTypes.credentials,
    );
    if (!storedCredentials) {
      storedCredentials = [];
    }
    // If credential was already stored update object else create new object
    const currentCredentialIndex = storedCredentials.findIndex(
      (obj) => obj.did === this.did,
    );
    if (currentCredentialIndex || currentCredentialIndex === 0) {
      storedCredentials[currentCredentialIndex].fspanswers = fspanswers;
    } else {
      const validatedFspData = {
        did: this.did,
        programId: this.programId,
        fspanswers,
      };
      storedCredentials.push(validatedFspData);
    }
    await this.storage.set(IonicStorageTypes.credentials, storedCredentials);
  }

  public doReload(): void {
    window.location.reload();
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
