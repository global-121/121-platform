import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Message } from '../models/message.model';
import { Note } from '../models/person.model';
import {
  RegistrationActivity,
  RegistrationActivityType,
} from '../models/registration-activity.model';

@Injectable({
  providedIn: 'root',
})
export class RegistrationActivityService {
  constructor(private translate: TranslateService) {}

  public createMessageActivity(message: Message): RegistrationActivity {
    const contentTypeLabel = this.translate.instant(
      `entity.message.content-type.${message.contentType}`,
    );
    const messageTypeLabel = this.translate.instant(
      `entity.message.type.${message.type}`,
    );

    return {
      type: RegistrationActivityType.message,
      label: `${contentTypeLabel} (${messageTypeLabel})`,
      date: new Date(message.created),
      description: message.body,
      activityStatus: message.messageStatus,
      messageErrorCode: message.errorCode || null,
    };
  }

  public createNoteActivity(note: Note): RegistrationActivity {
    return {
      type: RegistrationActivityType.note,
      label: this.translate.instant(
        'registration-details.activity-overview.activities.note.label',
      ),
      date: new Date(note.created),
      description: note.text,
      user: note.username,
    };
  }
}
