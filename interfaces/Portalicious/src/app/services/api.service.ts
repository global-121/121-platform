import { Injectable, inject } from '@angular/core';
import { VersionInfo } from '~/models/health.model';
import { Program, ProgramMetrics } from '~/models/program.model';
import { User } from '~/models/user.model';
import { HttpWrapperService } from '~/services/http-wrapper.service';

export enum ApiEndpoints {
  programs = 'programs',
  programsMetrics = 'metrics/program-stats-summary',
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
      endpoint: ApiEndpoints.usersChangePassword,
      body: {
        username,
        password,
        newPassword,
      },
    });
  }

  async getProjectById(id: number) {
    return this.httpWrapperService.perform121ServiceRequest<Program>({
      method: 'GET',
      endpoint: `${ApiEndpoints.programs}/${id.toString()}`,
    });
  }

  async getProjectSummaryMetrics(id: number) {
    return this.httpWrapperService.perform121ServiceRequest<ProgramMetrics>({
      method: 'GET',
      endpoint: `${ApiEndpoints.programs}/${id.toString()}/${ApiEndpoints.programsMetrics}`,
    });
  }
}
