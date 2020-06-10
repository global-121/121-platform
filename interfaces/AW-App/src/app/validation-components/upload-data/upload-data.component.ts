import { Component } from '@angular/core';
import { ConversationService } from 'src/app/services/conversation.service';
import { ValidationComponent } from '../validation-components.interface';
import { ValidationComponents } from '../validation-components.enum';

@Component({
  selector: 'app-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
})
export class UploadDataComponent implements ValidationComponent {

  constructor(
    public conversationService: ConversationService,
    // private storage: Storage
  ) { }

  ngOnInit() {
    console.log('Upload data')
  }

  getNextSection() {
    return ValidationComponents.mainMenu;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.uploadData,
      data: {},
      next: this.getNextSection(),
    });
  }

}
