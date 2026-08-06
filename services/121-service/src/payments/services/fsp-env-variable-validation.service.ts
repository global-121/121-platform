import { Injectable, Logger } from '@nestjs/common';

import {
  FspEnvVariableSettingsRecord,
  FspsWithoutIntersolveVoucherExceptions,
} from '@121-service/src/fsp-integrations/settings/fsp-env-variable-settings.const';
import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';

@Injectable()
export class FspEnvVariableValidationService {
  private readonly logger = new Logger(FspEnvVariableValidationService.name);

  // A pure function.
  // Validates every FSP's environment: the required env variables for EXTERNAL
  // FSPs, and — for FSPs that deliver via Twilio (`requiresTwilio: true`) — that
  // Twilio is not disabled.
  public validateFspEnvVariableSettings({
    fspEnvVariableSettings,
    twilioMode,
  }: {
    fspEnvVariableSettings: FspEnvVariableSettingsRecord;
    twilioMode: TwilioMode;
  }): { ok: boolean; messages: string[] } {
    // `Object.keys` and `Object.entries` cannot guarantee their input won't
    // have excess properties. But because we are the source of the input here
    // we *can* guarantee it and so we assert the type.
    const fsps = Object.keys(
      fspEnvVariableSettings,
    ) as FspsWithoutIntersolveVoucherExceptions[];

    const messages = fsps.flatMap((fsp) =>
      this.validateEnvVariableSettingsForSingleFsp({
        fsp,
        envVariableSettings: fspEnvVariableSettings[fsp],
        twilioMode,
      }),
    );

    if (messages.length === 0) {
      return { ok: true, messages: ['no missing variables'] };
    }
    return { ok: false, messages };
  }

  private validateEnvVariableSettingsForSingleFsp({
    fsp,
    envVariableSettings,
    twilioMode,
  }: {
    fsp: FspsWithoutIntersolveVoucherExceptions;
    envVariableSettings: FspEnvVariablesDto;
    twilioMode: TwilioMode;
  }): string[] {
    const { mode, variables, requiresTwilio } = envVariableSettings;

    if (mode === FspMode.disabled) {
      return [];
    }

    const messages: string[] = [];

    if (requiresTwilio && twilioMode === TwilioMode.disabled) {
      messages.push(
        `FSP "${fsp}" is enabled and requires Twilio, but "TWILIO_MODE=DISABLED". Set TWILIO_MODE to MOCK or EXTERNAL.`,
      );
    }

    if (mode === FspMode.external) {
      const envVariableIsSet = (envVar: unknown): boolean =>
        envVar !== undefined && envVar !== null && envVar !== '';

      const missingVariablesNames = Object.entries(variables)
        .filter(([_key, value]) => !envVariableIsSet(value))
        .map(([name, _value]) => `"${name}"`);

      if (missingVariablesNames.length > 0) {
        messages.push(
          `FSP "${fsp}" is enabled using "{FSP}_MODE=EXTERNAL", but is missing the following required environment variables: ${missingVariablesNames.join(
            ', ',
          )}.`,
        );
      }
    }

    return messages;
  }
}
