import * as jwt from 'jsonwebtoken';

export class BaseController {
  public constructor() {}

  protected getUserIdFromToken(authorization): any {
    if (!authorization) return null;

    const token = authorization.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.A121_SERVICE_SECRETS_SECRET);
    return decoded.id;
  }
}
