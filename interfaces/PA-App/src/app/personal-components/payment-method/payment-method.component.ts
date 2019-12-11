import { Component, Input } from '@angular/core';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';

import { Program } from 'src/app/models/program.model';
import { Fsp } from 'src/app/models/fsp.model';
import { PersonalComponent } from '../personal-component.class';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-payment-method',
  templateUrl: './payment-method.component.html',
  styleUrls: ['./payment-method.component.scss'],
})
export class PaymentMethodComponent extends PersonalComponent {
  @Input()
  public data: any;

  private did: string;
  public program: Program;
  public fsps: Fsp[];

  public fspChoice: number;
  public chosenFsp: Fsp;
  public fspSubmitted: boolean;

  constructor(
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
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
    await this.getProgram();
  }

  private async getProgram() {
    this.program = await this.paData.getCurrentProgram();
  }

  private storeFsp(chosenFsp: any) {
    this.paData.store(this.paData.type.fsp, chosenFsp);
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
    this.storeFsp(this.chosenFsp);
  }

  public async submitFsp() {
    this.fspSubmitted = true;
    this.programsService.postFsp(this.did, this.fspChoice).subscribe(() => {
      this.complete();
    });
  }

  getNextSection() {
    return PersonalComponents.selectAppointment;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.paymentMethod,
      data: {
        fsp: this.chosenFsp,
      },
      next: this.getNextSection(),
    });
  }

}
