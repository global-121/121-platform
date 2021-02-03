import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { concatMap, delay, retryWhen } from 'rxjs/operators';

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  private retryTimeOut = 2000;
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
