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

    const did = await this.paData.retrieve(this.paData.type.did);
    this.programsService.postConnectionCustomAttribute(
      did,
      'monitoringAnswer',
      this.monitoringChoice,
    );

    this.complete();
  }

  getNextSection() {
    return PersonalComponents.storeCredential;
  }

  cancel() {
    if (this.isDisabled) {
      return;
    }

    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.monitoringQuestion,
      data: {
        isCanceled: this.isCanceled,
      },
      next: this.getNextSection(),
    });
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
      },
      next: this.getNextSection(),
    });
  }
}
