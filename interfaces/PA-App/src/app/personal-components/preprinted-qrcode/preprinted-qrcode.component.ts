import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { Program } from 'src/app/models/program.model';
import { PaDataService } from 'src/app/services/padata.service';

@Component({
  selector: 'app-preprinted-qrcode',
  templateUrl: './preprinted-qrcode.component.html',
  styleUrls: ['./preprinted-qrcode.component.scss'],
})
export class PreprintedQrcodeComponent extends PersonalComponent {
  @Input()
  public data: any;

  public program: Program;

  public preprinted: boolean;
  public preprintedChoice: boolean;

  constructor(
    public conversationService: ConversationService,
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
    this.program = await this.paData.getCurrentProgram();
    // this.did = await this.paData.retrieve(this.paData.type.did);
    // this.timeslots = await this.programsService.getTimeslots(this.program.id);
    this.conversationService.stopLoading();
  }

  async initHistory() {
    this.isDisabled = true;
    // this.timeslotSubmitted = true;
    // this.chosenTimeslot = this.data.timeslot;
    // this.timeslotChoice = this.data.timeslot.id;
    // this.timeslots = [this.data.timeslot];
    this.program = await this.paData.getCurrentProgram();
    // this.confirmAction = ConfirmAction.confirm;
  }

  public changePreprinted($event) {
    this.preprinted = $event.detail.value === 'yes';
    this.preprintedChoice = true;
  }

  public submitPreprinted() {
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.meetingReminder;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.preprintedQrcode,
      data: {},
      next: this.getNextSection(),
    });
  }

}
