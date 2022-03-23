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
import {
  LoggingEvent,
  LoggingEventCategory,
} from '../models/logging-event.enum';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  private retryTimeOut = 2000;
  private retryConfirmLabel: string;
  private offlineLookupTimeout = 3000;

  constructor(
    private translate: TranslateService,
    private logger: LoggingService,
  ) {}

  private canRetry(status: number) {
    return [0, 502, 503].includes(status);
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
              this.logger.logEvent(
                LoggingEventCategory.error,
                LoggingEvent.requestRetryQuestion,
                { name: request.url },
              );

              const attemptRetry = window.confirm(this.getConfirmLabel());

              if (attemptRetry) {
                this.logger.logEvent(
                  LoggingEventCategory.ui,
                  LoggingEvent.requestRetryConfirm,
                  { name: request.url },
                );

                return of(error.status);
              }

              this.logger.logEvent(
                LoggingEventCategory.ui,
                LoggingEvent.requestRetryCancel,
                { name: request.url },
              );
            }

            return throwError(error);
          }),
          delay(this.retryTimeOut),
        );
      }),
    );
  }
}
