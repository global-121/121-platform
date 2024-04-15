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
      // Ignore if not using SSO
      !environment.use_sso_azure_entra ||
      // Ignore if not an API-request
      !request.url.startsWith(environment.url_121_service_api) ||
      // Ignore if request is to get current user
      !request.url.endsWith(ApiPath.usersCurrent)
    ) {
      return next.handle(request);
    }

    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) {
      // If no user found (this should never happen), then ignore to avoid SSO-redirect, and let it fail somewhere else
      return next.handle(request);
    }

    // If user found ..
    const user: User = JSON.parse(rawUser);
    // .. ignore if not an entra-user
    if (user?.isEntraUser === false) {
      return next.handle(request);
    }

    return super.intercept(request, next);
  }
}
