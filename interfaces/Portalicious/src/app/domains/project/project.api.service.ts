import { Injectable, Signal } from '@angular/core';
import { DomainApiService } from '~/domains/domain-api.service';
import {
  Project,
  ProjectMetrics,
  ProjectUser,
  ProjectUserWithRolesLabel,
} from '~/domains/project/project.model';

const BASE_ENDPOINT = 'programs';

@Injectable({
  providedIn: 'root',
})
export class ProjectApiService extends DomainApiService {
  getProject(projectId: Signal<number | undefined>) {
    return this.generateQueryOptions<Project>({
      path: [BASE_ENDPOINT, projectId],
      enabled: () => !!projectId(),
    });
  }

  getProjectSummaryMetrics(projectId: Signal<number>) {
    return this.generateQueryOptions<ProjectMetrics>({
      path: [BASE_ENDPOINT, projectId, 'metrics/program-stats-summary'],
    });
  }

  getProjectUsers(projectId: Signal<number>) {
    return this.generateQueryOptions<
      ProjectUser[],
      ProjectUserWithRolesLabel[]
    >({
      path: [BASE_ENDPOINT, projectId, 'users'],
      processResponse: (users) => {
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
      endpoint: BASE_ENDPOINT,
      params: {
        importFromKobo: true,
        koboToken: token,
        koboAssetId: assetId,
      },
    });
  }

  removeProjectUser(projectId: Signal<number>, userId: number) {
    return this.httpWrapperService.perform121ServiceRequest<Project>({
      method: 'DELETE',
      endpoint: `${BASE_ENDPOINT}/${projectId().toString()}/users/${userId.toString()}`,
    });
  }

  public invalidateCache(projectId?: Signal<number>): Promise<void> {
    const path: (Signal<number> | string)[] = [BASE_ENDPOINT];

    if (projectId) {
      path.push(projectId);
    }

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
