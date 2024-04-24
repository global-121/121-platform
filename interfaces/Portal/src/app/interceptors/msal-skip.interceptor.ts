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
import { USER_KEY } from '../auth/auth.service';
import { ApiPath } from '../enums/api-path.enum';
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
    if (
      environment.use_sso_azure_entra &&
      // Never intercept non-API requests
      !request.url.startsWith(environment.url_121_service_api)
    ) {
      return next.handle(request);
    }

    // Always intercept request for current user, as we need to check if user is an Entra user
    if (request.url.endsWith(ApiPath.usersCurrent)) {
      return super.intercept(request, next);
    }

    // Otherwise, check the exiting user from local storage
    const rawUser = localStorage.getItem(USER_KEY);

    if (rawUser) {
      const user = JSON.parse(rawUser) as User;

      // Only intercept Entra users
      if (user && user.isEntraUser) {
        return super.intercept(request, next);
      }
    }

    // In all other cases, move along, nothing to intercept here
    return next.handle(request);
  }
}
