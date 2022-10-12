import { Component, Input } from '@angular/core';
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
export class RegistrationSummaryComponent extends PersonalDirective {
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

  ngOnInit() {
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

    this.registrationStatus = await this.programsService.postRegistration(
      this.referenceId,
      this.program.id,
    );

    this.conversationService.stopLoading();

    this.complete();
  }

  async initHistory() {
    this.isDisabled = this.data.isDisabled;
    this.validation = this.data.validation;
    this.registrationStatus = this.data.registrationStatus;
    this.meetingDocuments = this.data.meetingDocuments;
  }

  private async getReferenceId() {
    this.referenceId = await this.paData.retrieve(this.paData.type.referenceId);
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

  complete() {
    if (this.isDisabled) {
      return;
    }

    if (!this.registrationMode.multiple && this.syncService.areTasksQueued()) {
      this.openOfflineNotification();
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
            this.complete();
          },
        },
      ],
    });

    return await popover.present();
  }
}
