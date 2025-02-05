import { environment } from '~environment';

export const getOriginUrl = (): string =>
  !environment.production
    ? window.location.origin
    : `${window.location.origin}/${environment.defaultLocale}`;
