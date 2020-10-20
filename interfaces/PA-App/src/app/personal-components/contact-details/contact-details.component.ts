import { Component, Input, ViewEncapsulation } from '@angular/core';
import { first } from 'rxjs/operators';
import { PersonalComponent } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';

@Component({
  selector: 'app-contact-details',
  templateUrl: './contact-details.component.html',
  styleUrls: ['./contact-details.component.scss'],
  encapsulation: ViewEncapsulation.None, // Disabled because we need to style inserted HTML from the database
})
export class ContactDetailsComponent extends PersonalComponent {
  @Input()
  public data: any;

  public contactDetails: string;

  public isCanceled = false;

  constructor(
    public conversationService: ConversationService,
    private instanceService: InstanceService,
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
    const instanceInformation = await this.instanceService.instanceInformation
      .pipe(first())
      .toPromise();

    if (!instanceInformation.contactDetails) {
      this.isCanceled = true;
      return;
    }

    this.contactDetails = instanceInformation.contactDetails;
  }

  getNextSection() {
    return PersonalComponents.selectProgram;
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
