import { Injectable, Logger } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FspEnvVariablesDto } from '@121-service/src/fsp-management/fsp-env-variables.dto';

@Injectable()
export class FspEnvVariableValidationService {
  private readonly logger = new Logger(FspEnvVariableValidationService.name);

  // A pure function.
  validateFspEnvVariableSettings({
    fspEnvVariableSettings,
  }: {
    fspEnvVariableSettings: Record<Fsps, FspEnvVariablesDto>;
  }): { ok: boolean; messages: string[] } {
    // For all FSPs that are enabled via `{FSP}_ENABLED`, ensure that all
    // required env variables are set.
    const validationResults = Object.entries(fspEnvVariableSettings).map(
      this.validateEnvVariableSettingsForSingleFsp.bind(this),
    );

    const failedValidations = validationResults.filter(Boolean);
    if (failedValidations.length === 0) {
      return { ok: true, messages: ['no missing variables'] };
    }

    const messages: string[] = [];
    failedValidations.forEach((failure) => {
      messages.push(failure as string);
    });
    return { ok: false, messages };
  }

  private validateEnvVariableSettingsForSingleFsp(
    singleFsp,
  ): undefined | string {
    const envVariableIsSet = (envVar: unknown): boolean =>
      envVar !== undefined && envVar !== null && envVar !== '';

    const [fsp, { enabled, variables }] = singleFsp;

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
