import { RegistrationPreferredLanguageTranslation } from '@121-service/src/shared/types/registration-preferred-language-translation.type';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

// Configuration for a single message template
interface SeedMessageTemplateConfigRecord {
  isSendMessageTemplate: boolean;
  isWhatsappTemplate: boolean;

  // What we show users in the UI. We don't show this in a language that's not a
  // UI language even though PAs may receive a message in a non-UI language.
  label?: UILanguageTranslation;

  // Twilio can (potentially) save a contentSid for each registration-preferred
  // language.
  contentSid?: RegistrationPreferredLanguageTranslation;

  // Content properties (either message or contentSid may be present). Twilio
  // can potentially save a message for each registration-preferred language.
  message?: RegistrationPreferredLanguageTranslation; // What a PA sees.
}

// Disabled eslint rule else the interface would be converted to a 'type'
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface SeedMessageTemplateConfig {
  [templateType: string]: SeedMessageTemplateConfigRecord;
}
