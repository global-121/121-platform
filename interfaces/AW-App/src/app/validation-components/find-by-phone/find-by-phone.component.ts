import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TimeoutError } from 'rxjs';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

class PaToValidateOption {
  referenceId: string;
  name: string;
  phoneNumber: string;
};


@Component({
  selector: 'app-find-by-phone',
  templateUrl: './find-by-phone.component.html',
  styleUrls: ['./find-by-phone.component.scss'],
})
export class FindByPhoneComponent implements ValidationComponent {
  public scanResult: string;
  public scanError = false;
  public paDataResult = false;
  public unknownReferenceIdCombination = false;
  public returnMainMenu = false;

  public inputPhonenumber = ''
  public questionName = 'checkPhoneNr'
  public phonenumberPlaceholder = '+00'
  public isFirst = true

  public phoneNumberInput = {
    value: '',
    isValid: false
  }

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    private storage: Storage,
    private modalController: ModalController,
  ) {}

  async ngOnInit() {
    console.log('Find by phone')
    // this.doScan();
    console.log(this.modalController)
  }

  public async findPaByPhone() {
    console.log('findPaByPhone: ');
    await this.getPaRegistrationId(this.inputPhonenumber);
  }

  private async getPaRegistrationId(phoneNumber: string): Promise<any> {
    let foundValidationData = await this.getRegistrationForPhoneOffline(phoneNumber);
    if (foundValidationData) {
      foundValidationData;
    } else {
      try {
        foundValidationData = await this.getRegistrationForPhoneOnline(phoneNumber);
        console.log('foundData: ', foundValidationData);
      } catch {
        return null;
      }
    }
    if (foundValidationData.length === 1) {
      this.findPaData(foundValidationData[0].referenceId)
    }
  }

  private async getRegistrationForPhoneOffline(phoneNumber: string): Promise<any> {
    console.log('getRegistrationForPhoneOffline: ');
    const validationDataProgram = await this.storage.get(
      IonicStorageTypes.validationProgramData,
    );
    const validationDataFsp = await this.storage.get(
      IonicStorageTypes.validationFspData,
    );
    console.log('validationDataFsp: ', validationDataFsp);
    let validationData = [...(validationDataProgram || []), ...(validationDataFsp || [])];
    console.log('validationData: ', validationData);
    const matchingReferenceId = []
    for (const element of validationData) {
      console.log('element: ', element);
      if (element.name === 'phoneNumber' && phoneNumber === element.phoneNumber) {
        matchingReferenceId.push(element.referenceId);
      }
    }
    console.log('matchingReferenceId: ', matchingReferenceId);

    if (matchingReferenceId.length === 0) {
      return;
    }

    if (matchingReferenceId.length === 1) {
      return matchingReferenceId[0]
    }
    return
  }

  private async getRegistrationForPhoneOnline(phoneNumber: string): Promise<string> {
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

    await this.storePaData(paData);
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  private async storePaData(paData: any) {
    await window.sessionStorage.setItem('paData', JSON.stringify(paData));
  }


  public openValidateProgramComponent() {
    this.paDataResult = true;
    this.unknownReferenceIdCombination = false;
    this.scanError = false;
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
