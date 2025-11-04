import { LocalizedStringForUI } from '@121-service/src/shared/types/localized-string-for-ui.type';

// Configuration for a single message template
interface SeedMessageTemplateConfigRecord {
  isSendMessageTemplate: boolean;
  isWhatsappTemplate: boolean;
  label?: LocalizedStringForUI;

  // Content properties (either message or contentSid may be present)
  message?: LocalizedStringForUI;
  contentSid?: LocalizedStringForUI;
}

// Disabled eslint rule else the interface would be converted to a 'type'
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface SeedMessageTemplateConfig {
  [templateType: string]: SeedMessageTemplateConfigRecord;
}
