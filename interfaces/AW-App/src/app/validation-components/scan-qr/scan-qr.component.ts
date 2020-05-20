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
    this.conversationService.startLoading();
    await this.sessionStorageService
      .retrieve(this.sessionStorageService.type.scannedData)
      .then(async (data) => {
        const paIdentifier = await this.getPaIdentifier(data);

        if (!paIdentifier) {
          this.scanError = true;
          return;
        }

        this.scanError = false;

        const paData = await this.findPaData(
          paIdentifier.did,
          paIdentifier.programId,
        );

        if (!paData) {
          this.unknownDidCombination = true;
          return;
        }

        this.storePaData(paData);
        this.foundCorrectPaData();
      });
    this.conversationService.stopLoading();
  }

  private isJson(str: string): boolean {
    try {
      JSON.parse(str);
    } catch {
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

    return this.isPaQrCode(JSON.parse(data));
  }

  private async getPaIdentifier(data: string): Promise<PaQrCode | false> {
    if (this.isValidPaQrCode(data)) {
      return JSON.parse(data);
    }

    try {
      const paDid = await this.programsService.getDidByQrIdentifier(data);

      return {
        did: paDid,
        programId: 1, // Hard-code Program ID for now...
      };
    } catch {
      return false;
    }
  }

  private async findPaData(did: string, programId: number): Promise<any> {
    let paData = await this.findPaDataOffline(did, programId);
    if (!paData) {
      paData = await this.findPaDataOnline(did, programId);
    }
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

  private storePaData(paData: any) {
    this.sessionStorageService.store(
      this.sessionStorageService.type.paData,
      JSON.stringify(paData),
    );
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
