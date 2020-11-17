import { Component } from '@angular/core';
import { first } from 'rxjs/operators';
import { MonitoringInfo } from 'src/app/models/instance.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';
import { PaDataService } from 'src/app/services/padata.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

export enum monitoringChoices {
  option1 = 'option1',
  option2 = 'option2',
  option3 = 'option3',
  option4 = 'option4',
}

@Component({
  selector: 'app-monitoring-question',
  templateUrl: './monitoring-question.component.html',
  styleUrls: ['./monitoring-question.component.scss'],
})
export class MonitoringQuestionComponent extends PersonalComponent {
  public isCanceled = false;
  public monitoringQuestion = new MonitoringInfo();

  public monitoringChoices = monitoringChoices;
  public monitoringChoice: string;
  public monitoringChosen: boolean;

  constructor(
    public conversationService: ConversationService,
    private instanceService: InstanceService,
    private translatableString: TranslatableStringService,
    private paData: PaDataService,
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
    this.monitoringChosen = this.data.monitoringChosen;

    await this.getMonitoringQuestion();

    this.conversationService.stopLoading();
  }

  private async getMonitoringQuestion() {
    const instanceInformation = await this.instanceService.instanceInformation
      .pipe(first())
      .toPromise();

    if (!instanceInformation.monitoringQuestion) {
      this.isCanceled = true;
      return;
    }
    const monitoringQuestion = JSON.parse(
      JSON.stringify(instanceInformation.monitoringQuestion),
    );
    this.monitoringQuestion.intro = this.translatableString.get(
      monitoringQuestion.intro,
    );
    this.monitoringQuestion.option1 = this.translatableString.get(
      monitoringQuestion.option1,
    );
    this.monitoringQuestion.option2 = this.translatableString.get(
      monitoringQuestion.option2,
    );
    this.monitoringQuestion.option3 = this.translatableString.get(
      monitoringQuestion.option3,
    );
    this.monitoringQuestion.option4 = this.translatableString.get(
      monitoringQuestion.option4,
    );
    this.monitoringQuestion.conclusion = this.translatableString.get(
      monitoringQuestion.conclusion,
    );
  }

  public changeMonitoringChoice(value: string) {
    this.monitoringChoice = value;
  }

  public submitMonitoringAnswer() {
    this.monitoringChosen = true;

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
        monitoringChosen: this.monitoringChosen,
      },
      next: this.getNextSection(),
    });
  }
}
