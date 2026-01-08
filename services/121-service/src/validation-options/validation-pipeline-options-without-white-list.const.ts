import { ValidationPipeOptions } from '@121-service/src/validation-options/validation-pipe-options.const';

export const ValidationPipelineOptionsWithoutWhiteList = {
  ...ValidationPipeOptions,
  whitelist: false, // Overwrite the default whitelist setting
  validateCustomDecorators: true, // Allows custom decorators to work
  forbidUnknownValues: false, // Allow unknown values for dynamic payloads
};
