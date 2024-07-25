import { Injectable, inject } from '@angular/core';
import { VersionInfo } from '~/models/health.model';
import { User } from '~/models/user.model';
import { HttpWrapperService } from '~/services/http-wrapper.service';

export enum ApiEndpoints {
  usersChangePassword = 'users/password',
  usersLogin = 'users/login',
  usersLogout = 'users/logout',
  versionInfo = 'health/version',
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private httpWrapperService = inject(HttpWrapperService);

  login({ username, password }: { username: string; password: string }) {
    return this.httpWrapperService.perform121ServiceRequest<User>({
      method: 'POST',
      endpoint: ApiEndpoints.usersLogin,
      body: {
        username,
        password,
      },
    });
  }

  logout() {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint: ApiEndpoints.usersLogout,
    });
  }

  getVersionInfo() {
    return this.httpWrapperService.perform121ServiceRequest<VersionInfo>({
      method: 'GET',
      endpoint: ApiEndpoints.versionInfo,
    });
  }

  changePassword({
    username,
    password,
    newPassword,
  }: {
    username: string;
    password: string;
    newPassword: string;
  }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint: 'users/password',
      body: {
        username,
        password,
        newPassword,
      },
    });
  }
}
