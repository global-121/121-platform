import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { retryWhen, concatMap, delay } from 'rxjs/operators';

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  private retryTimeOut = 2000;
  private retryConfirmLabel = 'Something went wrong, do you want to try again?';

  private canRetry(status: number) {
    return (status === 0);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        retryWhen(errors => {
          return errors.pipe(
            concatMap((error) => {
              if (this.canRetry(error.status)) {
                const attemptRetry = window.confirm(this.retryConfirmLabel);

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
