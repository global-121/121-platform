import * as jwt from 'jsonwebtoken';

export class BaseController {
  public constructor() {}

  protected getUserIdFromToken(authorization: string): number {
    if (!authorization) return null;

    const token = authorization.split(' ')[1];
    const decoded: any = jwt.verify(
      token,
      process.env.SECRETS_PA_ACCOUNTS_SERVICE_SECRET,
    );
    return decoded.id;
  }
}
