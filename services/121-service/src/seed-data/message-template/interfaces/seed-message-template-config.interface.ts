import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

// Configuration for a single message template
interface SeedMessageTemplateConfigRecord {
  isSendMessageTemplate: boolean;
  isWhatsappTemplate: boolean;
  label?: LocalizedString;

  // Content properties (either message or contentSid may be present)
  message?: LocalizedString;
  contentSid?: LocalizedString;
}

// Disabled eslint rule else the interface would be converted to a 'type'
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface SeedMessageTemplateConfig {
  [templateType: string]: SeedMessageTemplateConfigRecord;
}
