import { Component } from '@angular/core';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { ValidationComponents } from '../validation-components.enum';

@Component({
  selector: 'app-download-data',
  templateUrl: './download-data.component.html',
  styleUrls: ['./download-data.component.scss'],
})
export class DownloadDataComponent implements ValidationComponent {

  constructor(
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {}

  public backMainMenu() {
    this.complete();
  }

  getNextSection() {
    return ValidationComponents.mainMenu;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.viewAppointments,
      data: {},
      next: this.getNextSection(),
    });
  }

}
