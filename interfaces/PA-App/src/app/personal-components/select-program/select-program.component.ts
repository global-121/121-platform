import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Program } from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import {
  LoggingEvent,
  LoggingEventCategory,
} from '../../models/logging-event.enum';
import { LoggingService } from '../../services/logging.service';
import { InfoPopupComponent } from '../../shared/info-popup/info-popup.component';
import { PersonalDirective } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-select-program',
  templateUrl: './select-program.component.html',
  styleUrls: ['./select-program.component.scss'],
})
export class SelectProgramComponent extends PersonalDirective {
  @Input()
  public data;

  public programs: Program[];
  public programChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public conversationService: ConversationService,
    public translatableString: TranslatableStringService,
    private modalController: ModalController,
    private logger: LoggingService,
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

  initHistory() {
    this.isDisabled = true;
    const chosenProgram = this.data.chosenProgram;

    this.programChoice = this.data.chosenProgram.id;
    this.programs = [chosenProgram];
  }

  async initNew() {
    await this.getPrograms();
  }

  private async getPrograms() {
    this.conversationService.startLoading();

    this.programs = await this.paData.getAllPrograms();
    this.programs = this.translateProgramProperties(this.programs);

    this.conversationService.stopLoading();
  }

  private translateProgramProperties(programs: Program[]) {
    return programs.map((program: Program) => {
      program.titlePaApp = this.translatableString.get(program.titlePaApp);
      program.description = this.translatableString.get(program.description);
      program.aboutProgram = this.translatableString.get(program.aboutProgram);
      return program;
    });
  }

  private findProgramById(programId: number) {
    return this.programs.find((item: Program) => {
      return item.id === programId;
    });
  }

  public async openAboutProgramPopup(program: Program) {
    const infoPopup = await this.modalController.create({
      component: InfoPopupComponent,
      componentProps: {
        headingKey: 'personal.select-program.more-info-programs',
        message: program.aboutProgram,
      },
      cssClass: 'more-info-popup',
    });

    this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.popUpOpen, {
      name: 'personal.select-program.more-info-programs',
    });

    return await infoPopup.present();
  }

  public changeProgram($event) {
    this.programChoice = $event.detail.value;
  }

  public async submitProgram() {
    await this.paData.setCurrentProgramId(this.programChoice);

    this.complete();
  }

  getNextSection() {
    return PersonalComponents.consentQuestion;
  }

  complete() {
    this.isDisabled = true;
    const chosenProgram = this.findProgramById(this.programChoice);

    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectProgram,
      data: {
        chosenProgram: {
          id: chosenProgram.id,
          titlePaApp: chosenProgram.titlePaApp,
          description: chosenProgram.description,
        },
      },
      next: this.getNextSection(),
    });
  }
}
