import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getUserIdFromRequest } from './user.helper';

export const User = createParamDecorator((data, ctx: ExecutionContext) => {
  // if route is protected, there is a user set in auth.middleware
  const req = ctx.switchToHttp().getRequest();
  return getUserIdFromRequest(data, req);
});
