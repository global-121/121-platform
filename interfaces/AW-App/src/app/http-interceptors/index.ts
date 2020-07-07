import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RetryInterceptor } from './retry-interceptor';

/** Http Interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: RetryInterceptor, multi: true },
];
