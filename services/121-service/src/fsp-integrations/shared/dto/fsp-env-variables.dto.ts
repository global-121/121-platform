import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { EnvVariablesReadOnly } from '@121-service/src/shared/types/env-variables-readonly.type';

export class FspEnvVariablesDto {
  readonly mode: FspMode;

  readonly variables: EnvVariablesReadOnly;

  // When true, this FSP deliveres message via WhatsApp/SMS via Twilio
  // and therefore cannot function when Twilio is disabled (TWILIO_MODE=DISABLED).
  readonly requiresTwilio?: boolean;
}
