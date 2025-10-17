import { Injectable } from '@nestjs/common';

import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailType } from '@121-service/src/user/modules/user-emails/enum/email-type.enum';
import { getEmailBody } from '@121-service/src/user/modules/user-emails/helpers/get-body.helper';
import { getEmailSubject } from '@121-service/src/user/modules/user-emails/helpers/get-subject.helper';
import { EmailPayloadData } from '@121-service/src/user/modules/user-emails/interfaces/email-payload-data.interface';

@Injectable()
export class UserEmailsService {
  public buildEmailData(
    type: EmailType,
    payloadData: EmailPayloadData,
  ): EmailData {
    const {
      emailRecipient: { email },
    } = payloadData;

    const emailData: EmailData = {
      email,
      subject: getEmailSubject(type),
      body: getEmailBody(type, payloadData),
    };

    return emailData;
  }
}
