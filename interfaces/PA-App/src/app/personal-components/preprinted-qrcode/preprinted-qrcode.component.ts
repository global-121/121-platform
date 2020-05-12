import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { Program } from 'src/app/models/program.model';
import { PaDataService } from 'src/app/services/padata.service';
<<<<<<< HEAD
=======
import { QrScannerComponent } from '../../shared/qr-scanner/qr-scanner.component';
import { ModalController } from '@ionic/angular';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
>>>>>>> upstream/master

@Component({
  selector: 'app-preprinted-qrcode',
  templateUrl: './preprinted-qrcode.component.html',
  styleUrls: ['./preprinted-qrcode.component.scss'],
})
export class PreprintedQrcodeComponent extends PersonalComponent {
  @Input()
  public data: any;

<<<<<<< HEAD
  public program: Program;

  public preprinted: boolean;
  public preprintedChoice: boolean;
=======
  private QR_DATA_MINIMUM_LENGTH = 10;

  private did: string;
  public program: Program;

  public hasPreprinted: boolean;

  public scanResult: string;
  public scanResultError: boolean;
>>>>>>> upstream/master

  constructor(
    public conversationService: ConversationService,
    public paData: PaDataService,
<<<<<<< HEAD
=======
    public programsService: ProgramsServiceApiService,
    private modalController: ModalController,
>>>>>>> upstream/master
  ) {
    super();
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }

    this.initNew();
<<<<<<< HEAD
  }
=======
   }
>>>>>>> upstream/master

  async initNew() {
    this.conversationService.startLoading();
    this.program = await this.paData.getCurrentProgram();
<<<<<<< HEAD
    // this.did = await this.paData.retrieve(this.paData.type.did);
    // this.timeslots = await this.programsService.getTimeslots(this.program.id);
=======
    this.did = await this.paData.retrieve(this.paData.type.did);
>>>>>>> upstream/master
    this.conversationService.stopLoading();
  }

  async initHistory() {
    this.isDisabled = true;
<<<<<<< HEAD
    // this.timeslotSubmitted = true;
    // this.chosenTimeslot = this.data.timeslot;
    // this.timeslotChoice = this.data.timeslot.id;
    // this.timeslots = [this.data.timeslot];
    this.program = await this.paData.getCurrentProgram();
    // this.confirmAction = ConfirmAction.confirm;
  }

  public changePreprinted($event) {
    this.preprinted = $event.detail.value === 'yes';
    this.preprintedChoice = true;
  }

  public submitPreprinted() {
    this.complete();
  }

=======
    this.hasPreprinted = this.data.hasPreprinted;
    this.scanResult = this.data.scanResult;
    this.scanResultError = false;
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
    const qrScannerModal = await this.modalController.create({
      component: QrScannerComponent,
    });

    qrScannerModal.onWillDismiss().then((data: any) => this.handleScanResult(data.data));

    return await qrScannerModal.present();
  }

  private async handleScanResult(data?: any) {
    this.scanResult = data;

    if (
      !data ||
      (data && !this.isScanDataValid(data))
    ) {
      this.scanResultError = true;
      this.conversationService.stopLoading();
      return;
    }

    await this.programsService.addQrIdentifier(this.did, this.scanResult).then(
      () => {
        this.scanResultError = false;
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

>>>>>>> upstream/master
  getNextSection() {
    return PersonalComponents.meetingReminder;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.preprintedQrcode,
<<<<<<< HEAD
      data: {},
=======
      data: {
        hasPreprinted: this.hasPreprinted,
        scanResult: this.scanResult,
      },
>>>>>>> upstream/master
      next: this.getNextSection(),
    });
  }

}
