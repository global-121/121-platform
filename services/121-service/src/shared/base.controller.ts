import { verifyToken } from '../guards/guard.helper';

export class BaseController {
  protected getUserIdFromToken(authorization): any {
    if (!authorization) return null;

    const token = authorization.split(' ')[1];
    const decoded = verifyToken(token);
    return decoded.id;
  }
}
