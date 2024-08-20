import { Injectable, inject } from '@angular/core';
import { VersionInfo } from '~/models/health.model';
import { Payment } from '~/models/payment.model';
import { Project, ProjectMetrics, ProjectUser } from '~/models/project.model';
import { User } from '~/models/user.model';
import { HttpWrapperService } from '~/services/http-wrapper.service';

export enum ApiEndpoints {
  payments = 'payments',
  projects = 'programs',
  projectsMetrics = 'metrics/program-stats-summary',
  users = 'users',
  usersChangePassword = 'users/password',
  usersCurrent = 'users/current',
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

  getCurrentUser() {
    return this.httpWrapperService.perform121ServiceRequest<
      { user?: User } | undefined
    >({
      method: 'GET',
      endpoint: ApiEndpoints.usersCurrent,
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

  async getProjectById(id: number | string) {
    return this.httpWrapperService.perform121ServiceRequest<Project>({
      method: 'GET',
      endpoint: `${ApiEndpoints.projects}/${id.toString()}`,
    });
  }

  async getProjectSummaryMetrics(id: number) {
    return this.httpWrapperService.perform121ServiceRequest<ProjectMetrics>({
      method: 'GET',
      endpoint: `${ApiEndpoints.projects}/${id.toString()}/${ApiEndpoints.projectsMetrics}`,
    });
  }

  async getPayments(id: number) {
    return this.httpWrapperService.perform121ServiceRequest<Payment[]>({
      method: 'GET',
      endpoint: `${ApiEndpoints.projects}/${id.toString()}/${ApiEndpoints.payments}`,
    });
  }

  async createProjectFromKobo({
    token,
    assetId,
  }: {
    token: string;
    assetId: string;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Project | undefined
    >({
      method: 'POST',
      endpoint: ApiEndpoints.projects,
      params: {
        importFromKobo: true,
        koboToken: token,
        koboAssetId: assetId,
      },
    });
  }

  async getUsersInProject(projectId: number) {
    const users = await this.httpWrapperService.perform121ServiceRequest<
      ProjectUser[]
    >({
      method: 'GET',
      endpoint: `${ApiEndpoints.projects}/${projectId.toString()}/${ApiEndpoints.users}`,
    });

    return users.map((user) => ({
      ...user,
      roleString: user.roles.map((role) => role.label).join('; '),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
    }));
  }
}
