import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Message } from '../models/message.model';
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
      label: this.translate.instant(
        'registration-details.activity-overview.activities.message.label',
      ),
      subLabel: `${contentTypeLabel} (${messageTypeLabel})`,
      date: new Date(message.created),
      description: message.body,
      activityStatus: message.messageStatus,
      messageErrorCode: message.errorCode || null,
    };
  }
}
