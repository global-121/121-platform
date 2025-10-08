import { Injectable } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { User } from '~/domains/user/user.model';

const BASE_ENDPOINT = 'users';

@Injectable({
  providedIn: 'root',
})
export class UserApiService extends DomainApiService {
  login({ username, password }: { username: string; password: string }) {
    return this.httpWrapperService.perform121ServiceRequest<User>({
      method: 'POST',
      endpoint: `${BASE_ENDPOINT}/login`,
      body: {
        username,
        password,
      },
    });
  }

  logout() {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint: `${BASE_ENDPOINT}/logout`,
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
      endpoint: `${BASE_ENDPOINT}/password`,
      body: {
        username,
        password,
        newPassword,
      },
    });
  }

  resetPassword({ username }: { username?: string }) {
    if (!username) {
      return Promise.reject(new Error('Username is required'));
    }
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'PATCH',
      endpoint: `${BASE_ENDPOINT}/password`,
      body: {
        username,
      },
    });
  }

  getAllUsers() {
    return this.generateQueryOptions<User[]>({
      path: [BASE_ENDPOINT],
      queryKey: [BASE_ENDPOINT],
    });
  }

  getCurrent() {
    return this.generateQueryOptions<{ user: User }>({
      path: [`${BASE_ENDPOINT}/current`],
      queryKey: [BASE_ENDPOINT],
    });
  }

  createUser({
    username,
    displayName,
  }: {
    username: string;
    displayName: string;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<User>({
      method: 'POST',
      endpoint: BASE_ENDPOINT,
      body: {
        users: [
          {
            username,
            displayName,
          },
        ],
      },
    });
  }

  updateUserDisplayName({
    id,
    displayName,
  }: {
    id: number | undefined;
    displayName: string;
  }) {
    if (!id) {
      return Promise.reject(new Error('User ID is required'));
    }
    return this.httpWrapperService.perform121ServiceRequest<User>({
      method: 'PATCH',
      endpoint: `${BASE_ENDPOINT}/${id.toString()}`,
      body: {
        displayName,
      },
    });
  }
}
