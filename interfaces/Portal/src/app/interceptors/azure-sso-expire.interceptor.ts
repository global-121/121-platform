import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, lastValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService, CURRENT_USER_ENDPOINT_PATH } from '../auth/auth.service';

@Injectable()
export class AzureSsoExpireInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return from(this.handle(req, next));
  }

  async handle(request: HttpRequest<any>, next: HttpHandler) {
    if (request.url.includes(environment.url_121_service_api)) {
      if (!request.url.includes(CURRENT_USER_ENDPOINT_PATH)) {
        await this.authService.checkExpirationDate();
      }
    }
    return await lastValueFrom(next.handle(request));
  }
}
