import { CookieNames } from '../shared/enum/cookie.enums';

export type CookiesType = {
  [key in CookieNames]: string;
};
