import { Component } from '@angular/core';
import { MonitoringInfo } from 'src/app/models/instance.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { RegistrationModeService } from '../../services/registration-mode.service';
import { PersonalDirective } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-monitoring-question',
  templateUrl: './monitoring-question.component.html',
  styleUrls: ['./monitoring-question.component.scss'],
})
export class MonitoringQuestionComponent extends PersonalDirective {
  public isCanceled = false;
  public monitoringQuestion: MonitoringInfo;

  public monitoringChoice: string;
  public monitoringSubmitted: boolean;

  constructor(
    public conversationService: ConversationService,
    private instanceService: InstanceService,
    private paData: PaDataService,
    private programsService: ProgramsServiceApiService,
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
    await this.getMonitoringQuestion();

    this.conversationService.stopLoading();
  }

  async initHistory() {
    this.isCanceled = this.data.isCanceled;
    if (this.isCanceled) {
      return;
    }

    this.monitoringChoice = this.data.monitoringChoice;
    this.monitoringSubmitted = !!this.data.monitoringChoice;

    this.getMonitoringQuestion();

    this.conversationService.stopLoading();
  }

  private getMonitoringQuestion() {
    this.instanceService.instanceInformation.subscribe(
      (instanceInformation) => {
        if (!instanceInformation.monitoringQuestion) {
          this.isCanceled = true;
          this.cancel();
          return;
        }

        this.monitoringQuestion = instanceInformation.monitoringQuestion;
      },
    );
  }

  public changeMonitoringChoice(value: string) {
    this.monitoringChoice = value;
  }

  public async submitMonitoringAnswer() {
    this.monitoringSubmitted = true;

    const referenceId = await this.paData.retrieve(
      this.paData.type.referenceId,
    );
    this.programsService.postRegistrationCustomAttribute(
      referenceId,
      'monitoringAnswer',
      this.monitoringChoice,
    );

    this.conversationService.stopLoading();
    this.complete();
  }

  getNextSection() {
    return this.registrationMode.multiple
      ? PersonalComponents.nextPa
      : PersonalComponents.inclusionStatus;
  }

  cancel() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.monitoringQuestion,
      data: {
        isCanceled: this.isCanceled,
      },
      next: this.getNextSection(),
    });
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.monitoringQuestion,
      data: {
        monitoringChoice: this.monitoringChoice,
      },
      next: this.getNextSection(),
    });
  }
}
