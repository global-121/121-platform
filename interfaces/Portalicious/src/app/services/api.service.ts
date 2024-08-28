import { Injectable, Signal, inject } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { VersionInfo } from '~/models/health.model';
import { Payment } from '~/models/payment.model';
import {
  Project,
  ProjectMetrics,
  ProjectUser,
  ProjectUserWithRolesLabel,
} from '~/models/project.model';
import { User } from '~/models/user.model';
import { HttpWrapperService } from '~/services/http-wrapper.service';

export enum ApiEndpoints {
  projectMetrics = 'metrics/program-stats-summary',
  projectPayments = 'payments',
  projects = 'programs',
  projectUsers = 'users',
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

  /** Health */

  getVersionInfo() {
    return () =>
      queryOptions({
        queryKey: [ApiEndpoints.versionInfo],
        queryFn: () =>
          this.httpWrapperService.perform121ServiceRequest<VersionInfo>({
            method: 'GET',
            endpoint: ApiEndpoints.versionInfo,
          }),
      });
  }

  /** User */

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

  /** Project */

  getProject(projectId: Signal<number | undefined>) {
    return () =>
      queryOptions({
        queryKey: [ApiEndpoints.projects, projectId()],
        queryFn: () =>
          this.httpWrapperService.perform121ServiceRequest<Project>({
            method: 'GET',
            // this is safe because the query is only enabled when projectId is truthy
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            endpoint: `${ApiEndpoints.projects}/${projectId()!.toString()}`,
          }),
        enabled: !!projectId(),
      });
  }

  getProjectSummaryMetrics(projectId: Signal<number>) {
    return () =>
      queryOptions({
        queryKey: [
          ApiEndpoints.projects,
          projectId(),
          ApiEndpoints.projectMetrics,
        ],
        queryFn: async () =>
          this.httpWrapperService.perform121ServiceRequest<ProjectMetrics>({
            method: 'GET',
            endpoint: `${ApiEndpoints.projects}/${projectId().toString()}/${ApiEndpoints.projectMetrics}`,
          }),
      });
  }

  getProjectPayments(projectId: Signal<number>) {
    return () =>
      queryOptions({
        queryKey: [
          ApiEndpoints.projects,
          projectId(),
          ApiEndpoints.projectPayments,
        ],
        queryFn: async () =>
          this.httpWrapperService.perform121ServiceRequest<Payment[]>({
            method: 'GET',
            endpoint: `${ApiEndpoints.projects}/${projectId().toString()}/${ApiEndpoints.projectPayments}`,
          }),
      });
  }

  getProjectUsers(projectId: Signal<number>) {
    return () =>
      queryOptions({
        queryKey: [
          ApiEndpoints.projects,
          projectId(),
          ApiEndpoints.projectUsers,
        ],
        queryFn: async () => {
          const users = await this.httpWrapperService.perform121ServiceRequest<
            ProjectUser[]
          >({
            method: 'GET',
            endpoint: `${ApiEndpoints.projects}/${projectId().toString()}/${ApiEndpoints.projectUsers}`,
          });

          const usersWithRolesLabel: ProjectUserWithRolesLabel[] = users.map(
            (user) => ({
              ...user,
              allRolesLabel: user.roles.map((role) => role.label).join('; '),
              lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
            }),
          );

          return usersWithRolesLabel;
        },
      });
  }

  createProjectFromKobo({
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

  removeProjectUser(projectId: number, userId: number) {
    return this.httpWrapperService.perform121ServiceRequest<Project>({
      method: 'DELETE',
      endpoint: `${ApiEndpoints.projects}/${projectId.toString()}/${ApiEndpoints.projectUsers}/${userId.toString()}`,
    });
  }
}
