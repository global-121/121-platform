import { Component } from '@angular/core';
import { MonitoringInfo } from 'src/app/models/instance.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-monitoring-question',
  templateUrl: './monitoring-question.component.html',
  styleUrls: ['./monitoring-question.component.scss'],
})
export class MonitoringQuestionComponent extends PersonalComponent {
  public isCanceled = false;
  public monitoringQuestion: MonitoringInfo;

  public monitoringChoice: string;
  public monitoringSubmitted: boolean;

  constructor(
    public conversationService: ConversationService,
    private instanceService: InstanceService,
    private paData: PaDataService,
    private programsService: ProgramsServiceApiService,
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
    this.isDisabled = this.data.isDisabled;
    this.monitoringChoice = this.data.monitoringChoice;
    this.monitoringSubmitted = this.data.monitoringSubmitted;

    await this.getMonitoringQuestion();

    this.conversationService.stopLoading();
  }

  private async getMonitoringQuestion() {
    this.instanceService.instanceInformation.subscribe(
      (instanceInformation) => {
        if (!instanceInformation.monitoringQuestion) {
          this.isCanceled = true;
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

    const did = await this.paData.retrieve(this.paData.type.did);
    this.programsService.postConnectionCustomAttribute(
      did,
      'monitoringAnswer',
      this.monitoringChoice,
    );

    this.complete();
  }

  public logout() {
    this.paData.logout();
    window.location.reload();
  }

  getNextSection() {
    return PersonalComponents.storeCredential;
  }

  complete() {
    if (this.isDisabled) {
      return;
    }

    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.monitoringQuestion,
      data: {
        monitoringChoice: this.monitoringChoice,
        monitoringSubmitted: this.monitoringSubmitted,
      },
      next: this.getNextSection(),
    });
  }
}
