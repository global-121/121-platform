import { Component, Input } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Program } from 'src/app/models/program.model';
import { Timeslot } from 'src/app/models/timeslot.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { RegistrationModeService } from 'src/app/services/registration-mode.service';
import { SyncService } from 'src/app/services/sync.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { PersonalDirective } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-registration-summary',
  templateUrl: './registration-summary.component.html',
  styleUrls: ['./registration-summary.component.scss'],
})
export class RegistrationSummaryComponent extends PersonalDirective {
  @Input()
  public data: any;

  public validation: boolean;
  public validationByQr: boolean;

  public registrationStatus: boolean;

  private referenceId: string;

  public dateFormat = 'EEE, dd-MM-yyyy';
  public timeFormat = 'HH:mm';

  public program: Program;
  public meetingDocuments: string[];

  public chosenTimeslot: Timeslot;
  public daysToMeeting: number;

  public showQrCode: boolean;
  public qrDataString: string;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public translatableString: TranslatableStringService,
    public paData: PaDataService,
    private syncService: SyncService,
    private alertController: AlertController,
    private registrationMode: RegistrationModeService,
  ) {
    super();
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();
  }

  async initNew() {
    this.conversationService.startLoading();

    await this.checkValidation();

    await this.getReferenceId();
    await this.getProgram();

    this.registrationStatus = await this.programsService.postRegistration(
      this.referenceId,
    );

    if (this.validation && this.validationByQr) {
      await this.shouldShowQrCode();
      await this.generateContent();
    }

    this.conversationService.stopLoading();

    this.complete();
  }

  async initHistory() {
    this.isDisabled = this.data.isDisabled;
    this.validation = this.data.validation;
    this.registrationStatus = this.data.registrationStatus;
    this.meetingDocuments = this.data.meetingDocuments;
  }

  async checkValidation() {
    const currentProgram = await this.paData.getCurrentProgram();
    this.validation = currentProgram.validation;
    this.validationByQr = currentProgram.validationByQr;
  }

  private async shouldShowQrCode() {
    const usePreprintedQrCodeData = await this.paData.retrieve(
      this.paData.type.usePreprintedQrCode,
    );
    if (typeof usePreprintedQrCodeData !== undefined) {
      this.showQrCode = !JSON.parse(usePreprintedQrCodeData);
    } else {
      this.showQrCode = false;
    }
  }

  private async getReferenceId() {
    this.referenceId = await this.paData.retrieve(this.paData.type.referenceId);
  }

  private async getProgram() {
    this.program = await this.paData.getCurrentProgram();
    this.getProgramProperties(this.program);
  }

  private getProgramProperties(program: Program) {
    const documents = this.translatableString.get(program.meetingDocuments);
    this.meetingDocuments = this.buildDocumentsList(documents);
  }

  private buildDocumentsList(documents: string): string[] {
    return documents.split(';');
  }

  private generateQrCode(referenceId: string, programId: number) {
    const qrData = {
      referenceId,
      programId,
    };

    this.qrDataString = JSON.stringify(qrData);
  }

  public async generateContent() {
    this.generateQrCode(this.referenceId, this.program.id);
  }

  public retry() {
    window.location.reload();
  }

  getNextSection() {
    return PersonalComponents.monitoringQuestion;
  }

  complete() {
    if (this.isDisabled) {
      return;
    }

    if (!this.registrationMode.multiple && this.syncService.areTasksQueued()) {
      this.openOfflineNotification();
    }

    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.registrationSummary,
      data: {
        isDisabled: this.isDisabled,
        validation: this.validation,
        registrationStatus: this.registrationStatus,
        meetingDocuments: this.meetingDocuments,
      },
      next: this.getNextSection(),
    });
  }

  async openOfflineNotification() {
    // The behavior we were aiming for is:
    // Popup opens at the end of registration summary if there is no connection and we're in single mode.
    // There's a retry button that closes the popup, calls complete() again, and if there is still no connection the popup repoens again.

    const popover = await this.alertController.create({
      message:
        'You are currently offline. Your registration cannot be uploaded.', // TODO: find a better message and move it in en.json
      buttons: [
        {
          text: 'Retry', // TODO: move to en.json
          role: 'cancel',
          handler: () => {
            this.complete(); // TODO: it seems that this is not called
          },
        },
      ],
    });

    return await popover.present();
  }
}
