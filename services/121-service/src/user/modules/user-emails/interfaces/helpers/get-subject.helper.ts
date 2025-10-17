import { EmailType } from '@121-service/src/user/modules/user-emails/interfaces/enum/email-type.enum';

export const getEmailSubject = (type: EmailType): string => {
  switch (type) {
    case EmailType.registrationCreation:
      return '121 Portal account created';
    case EmailType.registrationCreationSSO:
      return '121 Portal account created';
    case EmailType.passwordReset:
      return '121 Portal password reset';
    default:
      return '121 Portal Notification';
  }
};
