import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-create-password',
  templateUrl: './create-password.component.html',
  styleUrls: ['./create-password.component.scss'],
})
export class CreatePasswordComponent implements PersonalComponent {

  public initialInput = false;
  public create: any;
  public confirm: any;
  public passwordCreated: boolean;

  constructor(
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {
  }

  public submitPassword(create: string, confirm: string) {
    console.log('submitPassword()', create, confirm);

    if (create !== confirm) {
      return;
    }

    this.passwordCreated = true;

    this.complete();
  }

  getNextSection() {
    return 'create-identity-details';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'create-identity-password',
      data: {
        password: this.create,
      },
      next: this.getNextSection(),
    });
  }
}
