import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-identity-form',
  templateUrl: './identity-form.component.html',
  styleUrls: ['./identity-form.component.scss'],
})
export class IdentityFormComponent implements PersonalComponent {

  public namePlaceholder: any;
  public dobPlaceholder: any;
  public name: any;
  public dob: any;
  public identitySubmitted: boolean;

  constructor(
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {
  }

  public submitIdentityForm(name, dob) {
    if (!name || !dob) {
      return;
    }

    this.identitySubmitted = true;
    console.log(name, dob);

    this.complete();
  }

  getNextSection() {
    return 'select-country';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'create-identity-details',
      data: {
        name: this.name,
        dob: this.dob,
      },
      next: this.getNextSection(),
    });
  }
}
