import { BadRequestException } from '@nestjs/common';

export const ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: false,
  forbidUnknownValues: true,
  exceptionFactory: (errors) => {
    for (const e of errors) {
      if (e.constraints && e.constraints['unknownValue']) {
        throw new Error(`Unknown validation value: ${JSON.stringify(e)}`);
      }
    }
    throw new BadRequestException(errors);
  },
};
