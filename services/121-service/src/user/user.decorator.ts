import { createParamDecorator } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export const User = createParamDecorator((data, req) => {
  // if route is protected, there is a user set in auth.middleware
  if (!!req.user) {
    return !!data ? req.user[data] : req.user;
  }

  // in case a route is not protected, we still want to get the optional auth user from jwt
  const token = req.cookies ? req.cookies['access_token'] : null;
  if (token) {
    const decoded: any = jwt.verify(
      token,
      process.env.SECRETS_121_SERVICE_SECRET,
    );
    return !!data ? decoded[data] : decoded.user;
  }
});
