import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { concatMap, delay, retryWhen, timeout } from 'rxjs/operators';

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  private retryTimeOut = 2000;
  private offlineTimeout = 3000;
  private offlineLookupTimeout = 3000;
  private retryConfirmLabel: string;

  constructor(private translate: TranslateService) {}

  private canRetry(status: number) {
    return status === 0;
  }

  private getConfirmLabel() {
    if (!this.retryConfirmLabel) {
      this.retryConfirmLabel = this.translate.instant('connection.error-retry');
    }
    return this.retryConfirmLabel;
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const res = [
      '/sovrin/credential/get-answers',
      '/sovrin/create-connection/qr-find-did',
      '/sovrin/create-connection/get-fsp/',
    ];
    // Exclude interceptor for offline usage
    for (const re of res) {
      if (request.url.search(re) !== -1) {
        console.log('Exception retry-interceptor');
        return next.handle(request).pipe(timeout(this.offlineTimeout));
      }
    }

    const resLookup = ['/notifications/lookup'];
    // Let lookup timeout fast, so in case there is not internet this
    for (const re of resLookup) {
      if (request.url.search(re) !== -1) {
        console.log('Exception lookup retry-interceptor');
        return next.handle(request).pipe(timeout(this.offlineLookupTimeout));
      }
    }

    return next.handle(request).pipe(
      retryWhen((errors) => {
        return errors.pipe(
          concatMap((error) => {
            if (this.canRetry(error.status)) {
              const attemptRetry = window.confirm(this.getConfirmLabel());

              if (attemptRetry) {
                return of(error.status);
              }
            }

            return throwError(error);
          }),
          delay(this.retryTimeOut),
        );
      }),
    );
  }
}
