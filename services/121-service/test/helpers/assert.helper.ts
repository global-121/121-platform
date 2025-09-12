import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export function processMessagePlaceholders(
  messageTemplates: MessageTemplateEntity[],
  registration: Partial<RegistrationEntity>,
  statusChange: RegistrationStatusEnum,
  placeholderKey: string,
): string {
  const template = messageTemplates.filter(
    (t) =>
      t.type === statusChange && t.language === registration.preferredLanguage,
  )[0].message;
  if (!template) {
    return '';
  }

  const processedTemplate = template.replace(
    new RegExp(`{{${placeholderKey}}}`, 'g'),
    registration[`${placeholderKey}`],
  );

  return processedTemplate;
}
