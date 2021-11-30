import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { TimeoutError } from 'rxjs';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';
import { RegistrationStatusEnum } from './../../../../../../services/121-service/src/registration/enum/registration-status.enum';

export enum CustomDataNameAttributes {
  name = 'name',
  nameFirst = 'nameFirst',
  nameLast = 'nameLast',
  firstName = 'firstName',
  secondName = 'secondName',
  thirdName = 'thirdName',
}

class PaToValidateOption {
  referenceId: string;
  name: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-find-by-phone',
  templateUrl: './find-by-phone.component.html',
  styleUrls: ['./find-by-phone.component.scss'],
})
export class FindByPhoneComponent implements ValidationComponent {
  public paDataResult = false;
  public returnMainMenu = false;

  public inputPhonenumber = '';
  public questionName = 'checkPhoneNr';
  public phonenumberPlaceholder = '+000 00 000 000';
  public isFirst = true;

  public peopleAffectedFound: PaToValidateOption[] = [];
  public paChoice: string;
  public noPeopleAffectedFound = false;

  private validatableStatuses = [
    RegistrationStatusEnum.registered,
    RegistrationStatusEnum.selectedForValidation,
  ];

  public phoneNumberInput = {
    value: '',
    isValid: false,
  };

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    private storage: Storage,
  ) {}

  async ngOnInit() {}

  public async findPaByPhone() {
    const cleanedPhoneNr = this.cleanPhoneNumber();
    await this.getPaRegistrationId(cleanedPhoneNr);
  }

  private cleanPhoneNumber(): string {
    return this.inputPhonenumber.replace(/\D/g, '');
  }

  public changePhoneNumber(): void {
    this.noPeopleAffectedFound = false;
  }

  private async getPaRegistrationId(phoneNumber: string): Promise<any> {
    let foundRegistrations = await this.getRegistrationForPhoneOffline(
      phoneNumber,
    );
    if (foundRegistrations) {
      foundRegistrations;
    } else {
      try {
        foundRegistrations = await this.getRegistrationForPhoneOnline(
          phoneNumber,
        );
      } catch {
        return null;
      }
    }
    if (!foundRegistrations) {
      this.noPeopleAffectedFound = true;
    } else if (foundRegistrations.length === 1) {
      this.findPaData(foundRegistrations[0].referenceId);
    } else if (foundRegistrations.length > 1) {
      this.peopleAffectedFound = foundRegistrations;
    }
  }

  public changePaChoice($event) {
    this.noPeopleAffectedFound = false;
    this.paChoice = $event.detail.value;
  }

  public submitPaChoice() {
    this.noPeopleAffectedFound = false;
    this.findPaData(this.paChoice);
  }

  private async getRegistrationForPhoneOffline(
    phoneNumber: string,
  ): Promise<any> {
    const validationDataProgram = await this.storage.get(
      IonicStorageTypes.validationProgramData,
    );
    const validationDataFsp = await this.storage.get(
      IonicStorageTypes.validationFspData,
    );
    let validationData;
    if (validationDataProgram) {
      validationData = validationDataProgram;
    } else {
      validationData = [];
    }
    if (validationDataFsp) {
      for (const registrationElement of validationDataFsp) {
        if (registrationElement.answers['phoneNumber']) {
          const appendItem = {
            referenceId: registrationElement.referenceId,
            programAnswer: registrationElement.answers['phoneNumber'].value,
            name: 'phoneNumber',
          };
          validationData.push(appendItem);
        }
      }
    }
    const matchingReferenceIds = [];
    for (const element of validationData) {
      if (
        element.name === 'phoneNumber' &&
        phoneNumber === element.programAnswer
      ) {
        matchingReferenceIds.push(element.referenceId);
      }
    }
    if (matchingReferenceIds.length === 0) {
      return;
    }

    if (matchingReferenceIds.length === 1) {
      return [{ referenceId: matchingReferenceIds[0] }];
    }
    if (matchingReferenceIds.length > 1) {
      return this.createOfflineOptionToValidate(
        matchingReferenceIds,
        validationData,
        phoneNumber,
      );
    }
  }

  private createOfflineOptionToValidate(
    referenceIds: string[],
    validationData: any[],
    phoneNumber: string,
  ) {
    const paToValidateOptions = [];
    for (const referenceId of referenceIds) {
      const paToValidateOption = new PaToValidateOption();
      paToValidateOption.name = validationData.find(
        (o) => o.referenceId === referenceId && o.name === 'name',
      ).programAnswer;
      paToValidateOption.referenceId = referenceId;
      paToValidateOption.phoneNumber = phoneNumber;
      paToValidateOptions.push(paToValidateOption);
    }
    return paToValidateOptions;
  }

  private async getRegistrationForPhoneOnline(
    phoneNumber: string,
  ): Promise<string> {
    try {
      const rawRegistrations = await this.programsService.getPaByPhoneNr(
        phoneNumber,
      );
      const registrations = rawRegistrations.filter((r) =>
        this.validatableStatuses.includes(r.registrationStatus),
      );

      if (registrations.length === 0) {
        return;
      }

      return registrations.map((pa) => {
        return {
          referenceId: pa.referenceId,
          name: pa.customData.name,
          phoneNumber: pa.phoneNumber,
        } as PaToValidateOption;
      });
    } catch (e) {
      console.log('Error: ', e);
      if (e.status === 0 || e instanceof TimeoutError) {
        return;
      }
    }
  }

  private async findPaData(referenceId: string): Promise<any> {
    let paData = await this.findPaDataOffline(referenceId);
    if (!paData) {
      paData = await this.findPaDataOnline(referenceId);
    }

    this.storePaData(paData);
    this.openValidateProgramComponent();
  }

  private async findPaDataOnline(referenceId: string): Promise<any> {
    try {
      const response = await this.programsService.getRegistration(referenceId);
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

  private async findPaDataOffline(referenceId: string): Promise<any> {
    const offlineData = await this.storage.get(
      IonicStorageTypes.validationProgramData,
    );
    if (!offlineData || !offlineData.length) {
      return;
    }
    const prefilledQuestions = [];
    offlineData.forEach((element) => {
      if (referenceId === element.referenceId) {
        prefilledQuestions.push(element);
      }
    });
    if (prefilledQuestions.length > 0) {
      return {
        referenceId,
        program: { id: offlineData[0].programId },
        programAnswers: prefilledQuestions,
      };
    }
  }

  private storePaData(paData: any) {
    window.sessionStorage.setItem('paData', JSON.stringify(paData));
  }

  public openValidateProgramComponent() {
    this.paDataResult = true;
    this.complete();
  }

  public backMainMenu() {
    this.returnMainMenu = true;
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.findByPhone,
      data: {},
      next: ValidationComponents.mainMenu,
    });
  }

  getNextSection() {
    return ValidationComponents.validateProgram;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.findByPhone,
      next: this.getNextSection(),
    });
  }
}
