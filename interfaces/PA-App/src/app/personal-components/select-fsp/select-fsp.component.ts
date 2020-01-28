import { Component, Input } from '@angular/core';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';

import { Program } from 'src/app/models/program.model';
import { Fsp } from 'src/app/models/fsp.model';
import { PersonalComponent } from '../personal-component.class';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';


@Component({
  selector: 'app-select-fsp',
  templateUrl: './select-fsp.component.html',
  styleUrls: ['./select-fsp.component.scss'],
})
export class SelectFspComponent extends PersonalComponent {
  @Input()
  public data: any;

  private did: string;
  public program: Program;
  public fsps: Fsp[];

  public fspChoice: number;
  public chosenFsp: Fsp;
  public fspSubmitted: boolean;

  public hasCustomAttributes: boolean;
  public customAttributes: any[];
  public customAttributeAnswers: any = {};
  public hasAnsweredAll: boolean;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
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
    this.conversationService.startLoading();
    this.fsps = this.program.financialServiceProviders;
    this.did = await this.paData.retrieve(this.paData.type.did);
    this.conversationService.stopLoading();
  }

  async initHistory() {
    this.isDisabled = true;
    this.fspSubmitted = true;
    this.chosenFsp = this.data.fsp;
    this.fspChoice = this.data.fsp.id;
    this.fsps = [this.data.fsp];
  }

  private getFspById(fspId: number) {
    return this.fsps.find((item: Fsp) => item.id === fspId);
  }

  public changeFsp($event) {
    if (this.isDisabled) {
      return;
    }

    this.fspChoice = parseInt($event.detail.value, 10);
    this.fspSubmitted = false;

    this.chosenFsp = this.getFspById(this.fspChoice);
    this.paData.store(this.paData.type.fsp, this.chosenFsp);
  }

  public async submitFsp() {
    this.fspSubmitted = true;

    this.programsService.postFsp(this.did, this.fspChoice);
    this.customAttributes = await this.getCustomAttributes();
    this.hasCustomAttributes = (this.customAttributes.length >= 1);

    if (!this.hasCustomAttributes) {
      return this.complete();
    }
  }

  private async getCustomAttributes() {
    // Update FSPs with more details:
    this.chosenFsp = await this.programsService.getFspById(this.fspChoice);

    return (this.chosenFsp.attributes.length > 0) ? this.chosenFsp.attributes : [];
  }

  public onCustomAttributeChange($eventTarget) {
    const questionKey = $eventTarget.name;
    const answerValue = $eventTarget.value;

    this.customAttributeAnswers[questionKey] = {
      key: questionKey,
      value: answerValue,
    };

    this.checkAnsweredAll();
  }

  private checkAnsweredAll() {
    this.hasAnsweredAll = (this.customAttributes.length === this.customAttributeAnswers.length);

    return this.hasAnsweredAll;
  }

  public submitCustomAttributes() {
    let answersSubmitted = 0;

    this.customAttributeAnswers.forEach(async (answer, index) => {
      await this.programsService.postConnectionCustomAttribute(this.did, answer.name, answer.value);
      answersSubmitted++;
    });

    if (answersSubmitted === this.customAttributes.length) {
      this.complete();
    }
  }

  getNextSection() {
    return PersonalComponents.setNotificationNumber;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectFsp,
      data: {
        fsp: this.chosenFsp,
      },
      next: this.getNextSection(),
    });
  }

}
