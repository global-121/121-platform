import {
  createParamDecorator,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';

import { ValidationPipelineOptionsWithoutWhitelist } from '@121-service/src/registration/validators/consts/validation-pipeline-options-without-white-list.const';

const RawBody = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    return request.body;
  },
);

// This custom decorator is needed to allow external callbacks with unknown or extra properties,
// and for endpoints with dynamic payloads such as registrations related endpoints.
// It applies a ValidationPipe with relaxed settings, so the global whitelist does not strip unknown properties
// Use this for endpoints where you do not control the exact payload structure (e.g., external integrations)
// The reason that this is needed is that the global ValidationPipe cannot be overridden for specific endpoints.

export const AnyValidBody = (...pipes: unknown[]) =>
  RawBody(
    new ValidationPipe(ValidationPipelineOptionsWithoutWhitelist),
    ...pipes,
  );
