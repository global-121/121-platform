import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-identity-form',
  templateUrl: './identity-form.component.html',
  styleUrls: ['./identity-form.component.scss'],
})
export class IdentityFormComponent implements PersonalComponent {
  public isDisabled = false;

  public namePlaceholder: any;
  public dobPlaceholder: any;
  public name: any;
  public dob: any;

  constructor(
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {
  }

  public submitIdentityForm(name, dob) {
    if (!name || !dob) {
      return;
    }

    console.log(name, dob);

    this.complete();
  }

  getNextSection() {
    return PersonalComponents.selectCountry;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.createIdentity,
      data: {
        name: this.name,
        dob: this.dob,
      },
      next: this.getNextSection(),
    });
  }
}
