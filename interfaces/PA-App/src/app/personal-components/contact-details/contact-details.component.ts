import { Component, Input } from '@angular/core';
import { Program } from 'src/app/models/program.model';
import { PersonalComponent } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';

@Component({
  selector: 'app-contact-details',
  templateUrl: './contact-details.component.html',
  styleUrls: ['./contact-details.component.scss'],
})
export class ContactDetailsComponent extends PersonalComponent {
  @Input()
  public data: any;

  public programDetails: Program;

  public isCanceled = false;

  constructor(
    public conversationService: ConversationService,
    private paData: PaDataService,
  ) {
    super();
  }

  async ngOnInit() {
    if (this.data) {
      this.initHistory();
    }

    await this.getProgramDetails();
    this.complete();
  }

  initHistory() {
    this.isDisabled = true;
    this.isCanceled = this.data.isCanceled;
  }

  private async getProgramDetails() {
    this.programDetails = await this.paData.getCurrentProgram();

    if (!this.programDetails.contactDetails) {
      this.isCanceled = true;
    }
  }

  getNextSection() {
    return PersonalComponents.consentQuestion;
  }

  complete() {
    if (this.isDisabled) {
      return;
    }

    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.contactDetails,
      data: {
        isCanceled: this.isCanceled,
      },
      next: this.getNextSection(),
    });
  }
}
