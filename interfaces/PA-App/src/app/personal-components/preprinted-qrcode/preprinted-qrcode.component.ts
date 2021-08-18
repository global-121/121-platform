import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Program } from 'src/app/models/program.model';
import { PersonalComponent } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { QrScannerComponent } from 'src/app/shared/qr-scanner/qr-scanner.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-preprinted-qrcode',
  templateUrl: './preprinted-qrcode.component.html',
  styleUrls: ['./preprinted-qrcode.component.scss'],
})
export class PreprintedQrcodeComponent extends PersonalComponent {
  @Input()
  public data: any;

  private QR_DATA_MINIMUM_LENGTH = 10;

  private referenceId: string;
  public program: Program;

  public hasPreprinted: boolean;

  public scanResult: string;
  public scanResultError: boolean;

  constructor(
    public conversationService: ConversationService,
    public paData: PaDataService,
    public programsService: ProgramsServiceApiService,
    private modalController: ModalController,
  ) {
    super();
  }

  async ngOnInit() {
    this.program = await this.paData.getCurrentProgram();

    if (this.data) {
      this.initHistory();
      return;
    }

    this.initNew();
  }

  async initNew() {
    await this.checkValidation();

    if (this.isCanceled) {
      return;
    }

    this.conversationService.startLoading();
    this.referenceId = await this.paData.retrieve(this.paData.type.referenceId);
    this.conversationService.stopLoading();
  }

  async initHistory() {
    this.isCanceled = this.data.isCanceled;

    if (this.isCanceled) {
      return;
    }

    this.isDisabled = true;
    this.hasPreprinted = this.data.hasPreprinted;
    this.scanResult = this.data.scanResult;
    this.scanResultError = false;
  }

  async checkValidation() {
    if (!this.program.validation) {
      this.cancel();
      return;
    }
    this.isCanceled = false;
  }

  public addPreprinted() {
    this.hasPreprinted = true;
    this.doScan();
  }

  public skipPreprinted() {
    this.hasPreprinted = false;
    this.complete();
  }

  public async doScan() {
    this.conversationService.startLoading();
    this.resetScan();
    this.scanResultError = false;

    await this.showQrScannerModal();
  }

  public resetScan() {
    this.scanResult = null;
  }

  private async showQrScannerModal() {
    const componentProps =
      environment.isDebug || environment.showDebug
        ? { debugInput: `01234567890` }
        : {};

    const qrScannerModal = await this.modalController.create({
      component: QrScannerComponent,
      componentProps,
    });

    qrScannerModal
      .onWillDismiss()
      .then((data: any) => this.handleScanResult(data.data));

    return await qrScannerModal.present();
  }

  private async handleScanResult(data?: any) {
    this.scanResult = data;

    if (!data || (data && !this.isScanDataValid(data))) {
      this.scanResultError = true;
      this.conversationService.stopLoading();
      return;
    }

    await this.programsService
      .addQrIdentifier(this.referenceId, this.scanResult)
      .then(
        async () => {
          this.scanResultError = false;
          await this.paData.store(
            this.paData.type.usePreprintedQrCode,
            this.hasPreprinted,
          );
          this.complete();
        },
        () => {
          this.scanResultError = true;
        },
      );

    this.conversationService.stopLoading();
  }

  private isScanDataValid(scanData: string) {
    return scanData.length > this.QR_DATA_MINIMUM_LENGTH;
  }

  getNextSection() {
    return PersonalComponents.registrationSummary;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.preprintedQrcode,
      data: {
        hasPreprinted: this.hasPreprinted,
        scanResult: this.scanResult,
      },
      next: this.getNextSection(),
    });
  }

  cancel() {
    this.isCanceled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.preprintedQrcode,
      data: {
        isCanceled: this.isCanceled,
      },
      next: this.getNextSection(),
    });
  }
}
