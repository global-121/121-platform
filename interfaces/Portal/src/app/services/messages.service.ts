import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Message,
  MessageStatus,
  MessageStatusMapping,
  TwilioStatus,
} from '../models/message.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private statusMapping = MessageStatusMapping;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {}

  public async getMessageHistory(
    programId: number,
    referenceId: string,
  ): Promise<Message[]> {
    return (
      await this.programsService.retrieveMsgHistory(programId, referenceId)
    ).map((message) => ({
      ...message,
      body: this.getMessageBody(message),
      messageStatus: this.getMessageStatus(message.status),
    }));
  }

  private getMessageBody(messageObject: Message): string {
    const message = messageObject.body ?? '';

    if (!messageObject.mediaUrl) {
      return message;
    }
    return `${this.translate.instant('entity.message.body-image-placeholder')}\n\n${message}`;
  }

  private getMessageStatus(twilioStatus: TwilioStatus): MessageStatus {
    return this.statusMapping[twilioStatus];
  }
}
