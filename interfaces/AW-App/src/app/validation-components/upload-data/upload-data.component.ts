import { Component, OnInit } from '@angular/core';
import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
})
export class UploadDataComponent implements OnInit {

  constructor(
    public conversationService: ConversationService,
    // private storage: Storage
  ) { }

  ngOnInit() {
    console.log('Upload data')
  }

}
