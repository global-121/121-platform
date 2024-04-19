import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsalInterceptor } from '@azure/msal-angular';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CURRENT_USER_ENDPOINT_PATH, USER_KEY } from '../auth/auth.service';
import { User } from '../models/user.model';

@Injectable()
export class MsalSkipInterceptor
  extends MsalInterceptor
  implements HttpInterceptor
{
  override intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (environment.use_sso_azure_entra) {
      // Only potentially skip on 121-service API requests
      if (request.url.includes(environment.url_121_service_api)) {
        // Never skip on request to get current user, as we need it always to check if user is an Entra user
        if (request.url.includes(CURRENT_USER_ENDPOINT_PATH)) {
          return super.intercept(request, next);
        }

        // Otherwise, get user from local storage
        const rawUser = localStorage.getItem(USER_KEY);
        if (!rawUser) {
          // If no user found (this should never happen), then skip to avoid SSO-redirect, and let it fail somewhere else
          return next.handle(request);
        }
        // If user found ..
        const user = JSON.parse(rawUser) as User;
        // .. skip if not an entra-user
        if (user?.isEntraUser === false) {
          return next.handle(request);
        }
        // .. otherwise don't skip
        return super.intercept(request, next);
      }
      return next.handle(request);
    }
    return next.handle(request);
  }
}
