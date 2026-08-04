import { Injectable } from '@nestjs/common';

import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';

@Injectable()
export class TwilioEnvVariableValidationService {
  // A pure function.
  public validateTwilioEnvVariables({
    mode,
    variables,
  }: {
    mode: TwilioMode;
    variables: Record<string, string | undefined>;
  }): { ok: boolean; messages: string[] } {
    // When Twilio is disabled, no environment variables are required.
    if (mode === TwilioMode.disabled) {
      return {
        ok: true,
        messages: ['Twilio is disabled, no variables required'],
      };
    }

    const missingVariables = Object.entries(variables)
      .filter(
        ([, value]) => value === undefined || value === null || value === '',
      )
      .map(([name]) => `"${name}"`);

    if (missingVariables.length === 0) {
      return { ok: true, messages: ['no missing variables'] };
    }

    return {
      ok: false,
      messages: [
        `Twilio is enabled using "TWILIO_MODE=${mode}", but is missing the following required environment variables: ${missingVariables.join(
          ', ',
        )}.`,
      ],
    };
  }
}
