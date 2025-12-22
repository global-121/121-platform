import { Injectable, Logger } from '@nestjs/common';

import {
  FspEnvVariableSettingsRecord,
  FspsWithoutIntersolveVoucherExceptions,
} from '@121-service/src/fsp-integrations/settings/fsp-env-variable-settings.const';
import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';

@Injectable()
export class FspEnvVariableValidationService {
  private readonly logger = new Logger(FspEnvVariableValidationService.name);

  // A pure function.
  public validateFspEnvVariableSettings({
    fspEnvVariableSettings,
  }: {
    fspEnvVariableSettings: FspEnvVariableSettingsRecord;
  }): { ok: boolean; messages: string[] } {
    // For all FSPs that are enabled via `{FSP}_ENABLED`, ensure that all
    // required env variables are set.

    // `Object.keys` and `Object.entries` cannot guarantee their input won't
    // have excess properties. But because we are the source of the input here
    // we *can* guarantee it and so we assert the type.
    const fsps = Object.keys(
      fspEnvVariableSettings,
    ) as FspsWithoutIntersolveVoucherExceptions[];

    const validationResults = fsps.map((fsp) =>
      this.validateEnvVariableSettingsForSingleFsp({
        fsp,
        envVariableSettings: fspEnvVariableSettings[fsp],
      }),
    );

    const failedValidations = validationResults.filter(
      (result): result is string => result !== undefined,
    );
    if (failedValidations.length === 0) {
      return { ok: true, messages: ['no missing variables'] };
    }
    return { ok: false, messages: failedValidations };
  }

  private validateEnvVariableSettingsForSingleFsp({
    fsp,
    envVariableSettings,
  }: {
    fsp: FspsWithoutIntersolveVoucherExceptions;
    envVariableSettings: FspEnvVariablesDto;
  }): undefined | string {
    const envVariableIsSet = (envVar: unknown): boolean =>
      envVar !== undefined && envVar !== null && envVar !== '';

    const { enabled, variables } = envVariableSettings;

    if (!enabled) {
      return;
    }

    const missingVariables = Object.entries(variables).filter(
      ([_key, value]) => !envVariableIsSet(value),
    );

    if (missingVariables.length === 0) {
      return;
    }

    const missingVariablesNames = missingVariables
      .map(([name, _value]) => `"${name}"`)
      .join(', ');
    return `FSP "${fsp}" is enabled using "{FSP}_ENABLED", but is missing the following required environment variables: ${missingVariablesNames}.`;
  }
}
