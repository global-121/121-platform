import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { PersonalDirective } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';

@Component({
  selector: 'app-contact-details',
  templateUrl: './contact-details.component.html',
  styleUrls: ['./contact-details.component.scss'],
  encapsulation: ViewEncapsulation.None, // Disabled because we need to style inserted HTML from the database
})
export class ContactDetailsComponent
  extends PersonalDirective
  implements OnInit
{
  @Input()
  public override data: any;

  public contactDetails: string;

  public override isCanceled = false;

  constructor(
    public conversationService: ConversationService,
    private instanceService: InstanceService,
  ) {
    super();
  }

  public async ngOnInit() {
    if (this.data) {
      this.initHistory();
    }

    this.updateContactDetails();
    this.complete();
  }

  override initHistory() {
    this.isDisabled = true;
    this.isCanceled = this.data.isCanceled;
  }

  private updateContactDetails() {
    this.instanceService.instanceInformation.subscribe(
      (instanceInformation) => {
        if (!instanceInformation.contactDetails) {
          this.isCanceled = true;
          return;
        }

        this.contactDetails = instanceInformation.contactDetails;
      },
    );
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
