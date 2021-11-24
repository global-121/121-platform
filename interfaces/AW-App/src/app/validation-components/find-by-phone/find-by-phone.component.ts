import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TimeoutError } from 'rxjs';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

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

  public phoneNumberInput = {
    value: '',
    isValid: false,
  };

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    private storage: Storage,
    private modalController: ModalController,
  ) {}

  async ngOnInit() {
    console.log('Find by phone');
    console.log(this.modalController);
  }

  public async findPaByPhone() {
    this.noPeopleAffectedFound = false;
    console.log('findPaByPhone: ');
    await this.getPaRegistrationId(this.inputPhonenumber);
  }

  private async getPaRegistrationId(phoneNumber: string): Promise<any> {
    let foundValidationData = await this.getRegistrationForPhoneOffline(
      phoneNumber,
    );
    if (foundValidationData) {
      foundValidationData;
    } else {
      try {
        foundValidationData = await this.getRegistrationForPhoneOnline(
          phoneNumber,
        );
        console.log('foundData: ', foundValidationData);
      } catch {
        return null;
      }
    }
    if (!foundValidationData) {
      this.noPeopleAffectedFound = true;
    } else if (foundValidationData.length === 1) {
      this.findPaData(foundValidationData[0].referenceId);
    } else if (foundValidationData.length > 1) {
      this.peopleAffectedFound = foundValidationData.map((pa) => {
        return {
          referenceId: pa.referenceId,
          name: this.getName(pa.customData),
          phoneNumber: pa.phoneNumber,
        } as PaToValidateOption;
      });
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

  public getName(customData): string {
    if (customData[CustomDataNameAttributes.name]) {
      return customData[CustomDataNameAttributes.name];
    } else if (customData[CustomDataNameAttributes.firstName]) {
      return (
        customData[CustomDataNameAttributes.firstName] +
        (customData[CustomDataNameAttributes.secondName]
          ? ' ' + customData[CustomDataNameAttributes.secondName]
          : '') +
        (customData[CustomDataNameAttributes.thirdName]
          ? ' ' + customData[CustomDataNameAttributes.thirdName]
          : '')
      );
    } else if (customData[CustomDataNameAttributes.nameFirst]) {
      return (
        customData[CustomDataNameAttributes.nameFirst] +
        (customData[CustomDataNameAttributes.nameLast]
          ? ' ' + customData[CustomDataNameAttributes.nameLast]
          : '')
      );
    } else {
      return '';
    }
  }

  private async getRegistrationForPhoneOffline(
    phoneNumber: string,
  ): Promise<any> {
    console.log('getRegistrationForPhoneOffline: ');
    const validationDataProgram = await this.storage.get(
      IonicStorageTypes.validationProgramData,
    );
    const validationDataFsp = await this.storage.get(
      IonicStorageTypes.validationFspData,
    );
    console.log('validationDataFsp: ', validationDataFsp);
    let validationData = [
      ...(validationDataProgram || []),
      ...(validationDataFsp || []),
    ];
    console.log('validationData: ', validationData);
    const matchingReferenceId = [];
    for (const element of validationData) {
      console.log('element: ', element);
      if (
        element.name === 'phoneNumber' &&
        phoneNumber === element.phoneNumber
      ) {
        matchingReferenceId.push(element.referenceId);
      }
    }
    console.log('matchingReferenceId: ', matchingReferenceId);

    if (matchingReferenceId.length === 0) {
      return;
    }

    if (matchingReferenceId.length === 1) {
      return matchingReferenceId[0];
    }
    return;
  }

  private async getRegistrationForPhoneOnline(
    phoneNumber: string,
  ): Promise<string> {
    console.log('getRegistrationForPhoneOnline: ');
    try {
      const response = await this.programsService.getPaByPhoneNr(phoneNumber);
      console.log('getRegistrationForPhoneOnline response: ', response);
      if (response.length === 0) {
        return;
      }
      return response;
    } catch (e) {
      console.log('Error: ', e);
      if (e.status === 0 || e instanceof TimeoutError) {
        return;
      }
    }
  }

  private async findPaData(referenceId: string): Promise<any> {
    console.log('referenceId: findPaData', referenceId);
    let paData = await this.findPaDataOffline(referenceId);
    if (!paData) {
      paData = await this.findPaDataOnline(referenceId);
      console.log('paData: findPaData', paData);
    }

    this.storePaData(paData);
    this.openValidateProgramComponent();
  }

  private async findPaDataOnline(referenceId: string): Promise<any> {
    try {
      const response = await this.programsService.getRegistration(referenceId);
      console.log('response: findPaDataOnline ', response);
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
    console.log('findPaDataOffline()');
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
