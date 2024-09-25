import { HttpParams } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { uniqBy } from 'lodash';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  Attribute,
  Project,
  ProjectMetrics,
  ProjectUser,
  ProjectUserAssignment,
  ProjectUserWithRolesLabel,
} from '~/domains/project/project.model';
import { Role } from '~/domains/role/role.model';

const BASE_ENDPOINT = 'programs';

@Injectable({
  providedIn: 'root',
})
export class ProjectApiService extends DomainApiService {
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

  getProjectAttributes({
    projectId,
    includeCustomAttributes = false,
    includeProgramQuestions = false,
    includeFspQuestions = false,
    includeTemplateDefaultAttributes = false,
    filterShowInPeopleAffectedTable = false,
  }: {
    projectId: Signal<number>;
    includeCustomAttributes?: boolean;
    includeProgramQuestions?: boolean;
    includeFspQuestions?: boolean;
    includeTemplateDefaultAttributes?: boolean;
    filterShowInPeopleAffectedTable?: boolean;
  }) {
    const params = new HttpParams({
      fromObject: {
        includeCustomAttributes,
        includeProgramQuestions,
        includeFspQuestions,
        includeTemplateDefaultAttributes,
        filterShowInPeopleAffectedTable,
      },
    });

    return this.generateQueryOptions<Attribute[]>({
      path: [BASE_ENDPOINT, projectId, 'attributes'],
      requestOptions: {
        params,
      },
      processResponse: (attributes) => {
        return uniqBy(attributes, 'name');
      },
    });
  }

  assignProjectUser(
    projectId: Signal<number>,
    {
      userId,
      roles,
      scope,
    }: {
      userId: number;
      roles: Role['role'][];
      scope: string;
    },
  ) {
    return this.httpWrapperService.perform121ServiceRequest<ProjectUserAssignment>(
      {
        method: 'PUT',
        endpoint: `${BASE_ENDPOINT}/${projectId().toString()}/users/${userId.toString()}`,
        body: {
          roles,
          scope,
        },
      },
    );
  }

  updateProjectUserAssignment(
    projectId: Signal<number>,
    {
      userId,
      roles,
      scope,
    }: {
      userId: number;
      roles: Role['role'][];
      scope: string;
    },
  ) {
    return this.httpWrapperService.perform121ServiceRequest<ProjectUserAssignment>(
      {
        method: 'PATCH',
        endpoint: `${BASE_ENDPOINT}/${projectId().toString()}/users/${userId.toString()}`,
        body: {
          rolesToAdd: roles,
          scope,
        },
      },
    );
  }

  removeProjectUser(projectId: Signal<number>, userId: number) {
    return this.httpWrapperService.perform121ServiceRequest<Project>({
      method: 'DELETE',
      endpoint: `${BASE_ENDPOINT}/${projectId().toString()}/users/${userId.toString()}`,
    });
  }

  addRegistrationNote({
    projectId,
    registrationReferenceId,
    note,
  }: {
    projectId: Signal<number>;
    registrationReferenceId: Signal<string>;
    note: string;
  }): Promise<unknown> {
    return this.httpWrapperService.perform121ServiceRequest<Project>({
      method: 'POST',
      endpoint: `${BASE_ENDPOINT}/${projectId().toString()}/registrations/${registrationReferenceId()}/notes`,
      body: {
        text: note,
      },
    });
  }

  getIntersolveVoucherBalance({
    projectId,
    registrationReferenceId,
    paymentId,
  }: {
    projectId: Signal<number>;
    registrationReferenceId: string;
    paymentId: number;
  }) {
    let params = new HttpParams();
    params = params.append('referenceId', registrationReferenceId);
    params = params.append('payment', paymentId);

    return this.generateQueryOptions<number>({
      path: [
        BASE_ENDPOINT,
        projectId,
        'financial-service-providers/intersolve-voucher/vouchers/balance',
      ],
      requestOptions: {
        params,
      },
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
