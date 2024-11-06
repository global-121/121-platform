import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

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

  const processedTemplate = template.replace(
    new RegExp(`{{${placeholderKey}}}`, 'g'),
    registration[`${placeholderKey}`],
  );

  return processedTemplate;
}

export function assertRegistrationBulkUpdate(
  patchData: Record<
    string,
    string | undefined | boolean | number | null | LocalizedString
  >,
  updatedRegistration: Record<
    string,
    string | undefined | boolean | number | null
  >,
  originalRegistration: Record<
    string,
    string | undefined | boolean | number | null
  >,
): void {
  for (const key in patchData) {
    expect(JSON.stringify(updatedRegistration[key])).toBe(
      JSON.stringify(patchData[key]),
    );
  }
  for (const key in originalRegistration) {
    if (patchData[key] === undefined && key !== 'name') {
      expect(updatedRegistration[key]).toStrictEqual(originalRegistration[key]);
    }
  }
}
