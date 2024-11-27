import { environment } from '~environment';

export function getOriginUrl(): string {
  return !environment.production
    ? window.location.origin
    : `${window.location.origin}/${environment.defaultLocale}`;
}
