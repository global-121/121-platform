import {
  createParamDecorator,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';

import { ValidationPipeOptions } from '@121-service/src/validation-pipe-options.const';

const RawBody = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest();
    return request.body;
  },
);

// This custom decorator is needed to allow external callbacks with unknown or extra properties,
// and for endpoints with dynamic payloads such as registrations related endpoints.
// It applies a ValidationPipe with relaxed settings, so the global whitelist does not strip unknown properties
// Use this for endpoints where you do not control the exact payload structure (e.g., external integrations)
// The reason that this is needed is that the global ValidationPipe cannot be overridden for specific endpoints.
const optionsWithoutWhitelist = {
  ...ValidationPipeOptions,
  whitelist: false, // Overwrite the default whitelist setting
  validateCustomDecorators: true, // Allows custom decorators to work
};

export const AnyValidBody = (...pipes: unknown[]) =>
  RawBody(new ValidationPipe(optionsWithoutWhitelist), ...pipes);
