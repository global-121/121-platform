import { supportEmail } from '@121-service/src/user/modules/user-emails/interfaces/enum/config.enum';
import { EmailType } from '@121-service/src/user/modules/user-emails/interfaces/enum/email-type.enum';
import { emailBodyPasswordReset } from '@121-service/src/user/modules/user-emails/interfaces/helpers/email-bodies/email-body-password-reset';
import { emailBodyRegistrationCreation } from '@121-service/src/user/modules/user-emails/interfaces/helpers/email-bodies/email-body-registration-creation';
import { emailBodyRegistrationCreationSSO } from '@121-service/src/user/modules/user-emails/interfaces/helpers/email-bodies/email-body-registration-creation-sso';
import { EmailPayloadData } from '@121-service/src/user/modules/user-emails/interfaces/interfaces/email-payload-data.interface';

/**
 * Get the email bodu
 * @param content HTML-content of the email; Output within a white box, between header and footer
 */
export const getEmailBody = (
  type: EmailType,
  payloadData: EmailPayloadData,
): string => {
  const portalName = '121 Portal';

  const body = `
    <style>
    html,
    body {
      margin: 0;
      padding: 0;
      font-family: Open Sans, ui-sans-serif, system-ui, sans-serif;
    }
    .header,
    .footer {
      padding: 1.2em;
      color: #fff;
      background-color: #0A2C5E;
    }
    .content {
      padding: 1.2em;
      margin: 1.2em;
      margin-bottom: 2em;
      color: #000;
      background-color: #fff;
      border-radius: 0.5em;
      box-shadow: 0 0 0.75em rgba(0, 0, 0, 0.1);
    }
    </style>

    <div class="header">
      <h1>${portalName}</h1>
    </div>

    <div class="content">
      ${getContent(type, payloadData)}
    </div>

    <div class="footer">
      121 Support: <a href="mailto:${supportEmail}" style="color:#fff">${supportEmail}</a>
    </div>
  `;

  return body;
};

const getContent = (type: EmailType, payloadData: EmailPayloadData): string => {
  switch (type) {
    case EmailType.registrationCreationSSO:
      return emailBodyRegistrationCreationSSO(payloadData);
    case EmailType.registrationCreation:
      return emailBodyRegistrationCreation(payloadData);
    case EmailType.passwordReset:
      return emailBodyPasswordReset(payloadData);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
};
