import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
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
export class RegistrationSummaryComponent
  extends PersonalDirective
  implements OnInit
{
  @Input()
  public data: any;

  public validation: boolean;

  public registrationStatus: boolean;

  private referenceId: string;

  public dateFormat = 'EEE, dd-MM-yyyy';
  public timeFormat = 'HH:mm';

  public program: Program;
  public meetingDocuments: string[];

  public chosenTimeslot: Timeslot;
  public daysToMeeting: number;

  public showSomethingWentWrong = false;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public translatableString: TranslatableStringService,
    public paData: PaDataService,
    private syncService: SyncService,
    private alertController: AlertController,
    private registrationMode: RegistrationModeService,
    private translate: TranslateService,
  ) {
    super();
  }

  public ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();
  }

  async initNew() {
    this.conversationService.startLoading();

    await this.getProgram();
    await this.getReferenceId();
    if (!this.registrationStatus) {
      this.registrationStatus = await this.programsService.postRegistration(
        this.referenceId,
        this.program.id,
      );
    }

    if (
      !this.syncService.areTasksQueued() &&
      this.registrationStatus === false
    ) {
      this.showSomethingWentWrong = true;
    }

    this.conversationService.stopLoading();

    this.checkStatus();
  }

  async initHistory() {
    this.isDisabled = this.data.isDisabled;
    this.validation = this.data.validation;
    this.registrationStatus = this.data.registrationStatus;
    this.meetingDocuments = this.data.meetingDocuments;
  }

  private async getReferenceId() {
    this.referenceId = await this.paData.getReferenceId();
  }

  private async getProgram() {
    this.program = await this.paData.getCurrentProgram();
    this.getProgramProperties(this.program);
  }

  private getProgramProperties(program: Program) {
    this.validation = program.validation;

    const documents = this.translatableString.get(program.meetingDocuments);
    this.meetingDocuments = this.buildDocumentsList(documents);
  }

  private buildDocumentsList(documents: string): string[] {
    if (!documents) {
      return [];
    }

    return documents.split(';');
  }

  public retry() {
    window.location.reload();
  }

  getNextSection() {
    return PersonalComponents.monitoringQuestion;
  }

  async checkStatus() {
    // Single online registration
    if (this.registrationStatus) {
      console.log('Single online registration');
      this.complete();
      return;
    }

    // Single online registration but need to refetch status
    if (!this.registrationStatus && !this.syncService.areTasksQueued()) {
      this.registrationStatus = await this.programsService.isStatusRegistered(
        this.referenceId,
        this.program.id,
      );

      if (this.registrationStatus) {
        this.complete();
        return;
      }
    }

    // Multiple registrations mode
    if (!this.registrationStatus && this.registrationMode.multiple) {
      this.complete();
      return;
    }

    // Single offline registration
    if (!this.registrationMode.multiple && this.syncService.areTasksQueued()) {
      this.openOfflineNotification();
      return;
    }

    if (
      !this.syncService.areTasksQueued() &&
      this.registrationStatus === false
    ) {
      this.showSomethingWentWrong = true;
      return;
    }
  }

  complete() {
    if (this.isDisabled) {
      return;
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
    const popover = await this.alertController.create({
      message: this.translate.instant(
        'personal.registration-summary.offline-warning',
      ),
      buttons: [
        {
          text: this.translate.instant('shared.retry'),
          role: 'cancel',
          handler: () => {
            this.checkStatus();
          },
        },
      ],
    });

    return await popover.present();
  }
}
