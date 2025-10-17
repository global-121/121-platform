import { Injectable } from '@nestjs/common';

import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailType } from '@121-service/src/user/user-emails/enum/email-type.enum';
import { EmailPayloadData } from '@121-service/src/user/user-emails/interfaces/email-payload-data.interface';
import { UserEmailTemplatesService } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.service';

@Injectable()
export class UserEmailsService {
  constructor(
    private readonly userEmailTemplatesService: UserEmailTemplatesService,
  ) {}

  public buildEmailData(
    type: EmailType,
    payloadData: EmailPayloadData,
  ): EmailData {
    const {
      emailRecipient: { email },
    } = payloadData;

    const { subject, body } = this.userEmailTemplatesService.buildEmailTemplate(
      type,
      payloadData,
    );

    const emailData: EmailData = {
      email,
      subject,
      body,
    };

    return emailData;
  }
}
