import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';

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

export function assertRegistrationImport(response: any, expected: any): void {
  expect(response.phoneNumber).toBe(expected.phoneNumber);
  expect(response.lastName).toBe(expected.lastName);
  expect(response.addressStreet).toBe(expected.addressStreet);
  expect(response.addressHouseNumber).toBe(expected.addressHouseNumber);
  expect(response.addressHouseNumberAddition).toBe(
    expected.addressHouseNumberAddition,
  );
}
