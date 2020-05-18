import { Storage } from '@ionic/storage';
import { SessionStorageService } from './../../services/session-storage.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ValidationComponents } from '../validation-components.enum';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { TimeoutError } from 'rxjs';
import { PaQrCode } from 'src/app/models/pa-qr-code.model';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.scss'],
})
export class ScanQrComponent implements ValidationComponent {
  public gettingPaData = false;

  public scanError = false;
  public paDataResult = false;
  public unknownDidCombination = false;
  public returnMainMenu = false;

  public ionicStorageTypes = IonicStorageTypes;

  constructor(
    private router: Router,
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public sessionStorageService: SessionStorageService,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    this.scanQrCode();
  }

  public async scanQrCode() {
    const storageSubscription = this.sessionStorageService
      .watchStorage()
      .subscribe(async () => {
        await this.checkScannedData();
        storageSubscription.unsubscribe();
      });
    this.router.navigate(['/scan-qr']);
  }

  private async checkScannedData() {
    this.gettingPaData = true;
    this.sessionStorageService
      .retrieve(this.sessionStorageService.type.scannedData)
      .then(async (data) => {
        const paToValidate = await this.getPaToValidate(data);
        const paData = await this.findPaData(
          paToValidate.did,
          paToValidate.programId,
        );

        if (paData) {
          this.sessionStorageService.store(
            this.sessionStorageService.type.paData,
            JSON.stringify(paData),
          );
          this.foundCorrectPaData();
        } else {
          this.unknownDidCombination = true;
        }
      });
  }

  private isJson(str: string): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  private isPaQrCode(data: any): data is PaQrCode {
    return data.did !== undefined && data.programId !== undefined;
  }

  private isValidPaQrCode(data: string): boolean {
    if (!this.isJson(data)) {
      return false;
    }

    const parsedData = JSON.parse(data);

    return this.isPaQrCode(parsedData);
  }

  private async getPaToValidate(data: string): Promise<PaQrCode> {
    let paToValidate: PaQrCode;

    if (this.isValidPaQrCode(data)) {
      paToValidate = JSON.parse(data);
    } else {
      const foundDid = await this.programsService.getDidByQrIdentifier(data);

      if (!foundDid || !foundDid.did) {
        this.scanError = true;
        return;
      }
      paToValidate = {
        did: foundDid.did,
        programId: 1, // Hard-code Program ID for now...
      };
    }

    return paToValidate;
  }

  private async findPaData(did: string, programId: number): Promise<any> {
    let paData = await this.findPaDataOffline(did, programId);
    if (!paData) {
      paData = await this.findPaDataOnline(did, programId);
    }
    this.gettingPaData = false;
    return paData;
  }

  private async findPaDataOnline(did: string, programId: number): Promise<any> {
    console.log('findPaDataOnline()');
    try {
      const response = await this.programsService.getPrefilledAnswers(
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

  private async findPaDataOffline(
    did: string,
    programId: number,
  ): Promise<any> {
    console.log('findPaDataOffline()');
    const offlineData = await this.storage.get(
      this.ionicStorageTypes.validationData,
    );
    if (!offlineData || !offlineData.length) {
      return;
    }
    const prefilledQuestions = [];
    offlineData.forEach((element) => {
      if (did === element.did && programId === element.programId) {
        prefilledQuestions.push(element);
      }
    });
    if (prefilledQuestions.length > 0) {
      return prefilledQuestions;
    }
  }

  private foundCorrectPaData() {
    this.paDataResult = true;
    this.unknownDidCombination = false;
    this.scanError = false;
    this.complete();
  }

  public backMainMenu() {
    this.returnMainMenu = true;
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.scanQr,
      data: {},
      next: ValidationComponents.mainMenu,
    });
  }

  getNextSection() {
    return ValidationComponents.validateProgram;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.scanQr,
      next: this.getNextSection(),
    });
  }
}
