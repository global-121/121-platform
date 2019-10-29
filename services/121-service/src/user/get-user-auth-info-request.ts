import { Request } from 'express';
export interface IGetUserAuthInfoRequest extends Request {
  user: any;
}
// Extended request definition using this:
// https://stackoverflow.com/questions/44383387/typescript-error-property-user-does-not-exist-on-type-request
