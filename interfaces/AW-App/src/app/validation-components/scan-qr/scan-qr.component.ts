import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TimeoutError } from 'rxjs';
import { PaQrCode } from 'src/app/models/pa-qr-code.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { QrScannerComponent } from 'src/app/shared/qr-scanner/qr-scanner.component';
import { environment } from 'src/environments/environment';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.scss'],
})
export class ScanQrComponent implements ValidationComponent {
  public scanResult: string;
  public scanError = false;
  public paDataResult = false;
  public unknownReferenceIdCombination = false;
  public returnMainMenu = false;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    private storage: Storage,
    private modalController: ModalController,
  ) {}

  async ngOnInit() {
    this.doScan();
  }

  public async doScan() {
    this.resetScan();
    this.scanError = false;

    await this.showQrScannerModal();
  }

  public resetScan() {
    this.scanResult = null;
  }

  private async showQrScannerModal() {
    const componentProps =
      environment.isDebug || environment.showDebug
        ? {
            debugInput: `{ "referenceId": "_referenceId_"}`,
          }
        : {};
    const qrScannerModal = await this.modalController.create({
      component: QrScannerComponent,
      componentProps,
    });

    qrScannerModal.onWillDismiss().then((data: any) => {
      this.checkScannedData(data.data);
    });

    return await qrScannerModal.present();
  }

  private async checkScannedData(data: string) {
    const paIdentifier = await this.getPaIdentifier(data);

    if (!paIdentifier) {
      this.scanError = true;
      return;
    }

    this.scanError = false;

    const paData = await this.findPaData(
      paIdentifier.referenceId,
    );

    if (!paData) {
      this.unknownReferenceIdCombination = true;
      return;
    }

    this.storePaData(paData);
    this.foundCorrectPaData();
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
    return data.referenceId !== undefined;
  }

  private isValidPaQrCode(data: string): boolean {
    if (!this.isJson(data)) {
      return false;
    }

    return this.isPaQrCode(JSON.parse(data));
  }

  private async getPaIdentifier(data: string): Promise<PaQrCode | false> {
    console.log('data: getPaIdentifier', data);
    if (this.isValidPaQrCode(data)) {
      return JSON.parse(data);
    }

    const referenceIdJson = {
      referenceId: undefined,
    };

    referenceIdJson.referenceId = await this.getPaIdentifierOffline(data);
    console.log('referenceIdProgramId: ', referenceIdJson);
    if (referenceIdJson.referenceId) {
      return referenceIdJson;
    }
    try {
      referenceIdJson.referenceId = await this.getPaIdentifierOnline(data);
      return referenceIdJson;
    } catch {
      return false;
    }
  }

  private async getPaIdentifierOffline(data: string): Promise<string> {
    console.log('getPaIdentifierOffline');
    const qrConnectionMapping = await this.storage.get(
      IonicStorageTypes.qrConnectionMapping,
    );
    if (!qrConnectionMapping || !qrConnectionMapping.length) {
      return;
    }
    for (const element of qrConnectionMapping) {
      if (data === element.qrIdentifier) {
        return element.referenceId;
      }
    }
  }

  private async getPaIdentifierOnline(data: string): Promise<string> {
    console.log('getPaIdentifierOnline');
    try {
      const response = await this.programsService.getConnectionByQrIdentifier(
        data,
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

  private async findPaData(
    referenceId: string,
  ): Promise<any> {
    let paData = await this.findPaDataOffline(referenceId);
    if (!paData) {
      paData = await this.findPaDataOnline(referenceId);
    }
    return paData;
  }

  private async findPaDataOnline(
    referenceId: string,
  ): Promise<any> {
    try {
      const response = await this.programsService.getRegistration(
        referenceId,
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
    referenceId: string,
  ): Promise<any> {
    console.log('findPaDataOffline()');
    const offlineData = await this.storage.get(
      IonicStorageTypes.validationProgramData,
    );
    if (!offlineData || !offlineData.length) {
      return;
    }
    const prefilledQuestions = [];
    offlineData.forEach((element) => {
      if (
        referenceId === element.referenceId
      ) {
        prefilledQuestions.push(element);
      }
    });
    if (prefilledQuestions.length > 0) {
      return prefilledQuestions;
    }
  }

  private storePaData(paData: any) {
    window.sessionStorage.setItem('paData', JSON.stringify(paData));
  }

  private foundCorrectPaData() {
    this.paDataResult = true;
    this.unknownReferenceIdCombination = false;
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
