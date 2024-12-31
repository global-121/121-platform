import { inject, Injectable, Signal } from '@angular/core';

import { uniqBy } from 'lodash';

import { ActionReturnDto } from '@121-service/src/actions/dto/action-return.dto';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { CommercialBankEthiopiaValidationReportDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-validation-report.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  Attribute,
  AttributeWithTranslatedLabel,
  Project,
  ProjectUser,
  ProjectUserAssignment,
  ProjectUserWithRolesLabel,
} from '~/domains/project/project.model';
import {
  ATTRIBUTE_LABELS,
  isGenericAttribute,
} from '~/domains/project/project-attribute.helpers';
import { Role } from '~/domains/role/role.model';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = 'programs';

@Injectable({
  providedIn: 'root',
})
export class ProjectApiService extends DomainApiService {
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

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
      httpParams: {
        importFromKobo: true,
        koboToken: token,
        koboAssetId: assetId,
      },
    });
  }

  getProject(projectId: Signal<number | string | undefined>) {
    return this.generateQueryOptions<Project>({
      path: [BASE_ENDPOINT, projectId],
      enabled: () => !!projectId(),
    });
  }

  getProjectUsers(projectId: Signal<number | string>) {
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
    includeProgramRegistrationAttributes = false,
    includeTemplateDefaultAttributes = false,
    filterShowInPeopleAffectedTable = false,
  }: {
    projectId: Signal<number | string>;
    includeProgramRegistrationAttributes?: boolean;
    includeTemplateDefaultAttributes?: boolean;
    filterShowInPeopleAffectedTable?: boolean;
  }) {
    return this.generateQueryOptions<
      Attribute[],
      AttributeWithTranslatedLabel[]
    >({
      path: [BASE_ENDPOINT, projectId, 'attributes'],
      params: {
        includeProgramRegistrationAttributes,
        includeTemplateDefaultAttributes,
        filterShowInPeopleAffectedTable,
      },
      processResponse: (attributes) => {
        return uniqBy(attributes, 'name').map((attribute) => {
          const translatedLabel = this.translatableStringService.translate(
            attribute.label,
          );
          return {
            ...attribute,
            label:
              translatedLabel ??
              (isGenericAttribute(attribute.name)
                ? ATTRIBUTE_LABELS[attribute.name]
                : undefined) ??
              attribute.name,
          };
        });
      },
    });
  }

  assignProjectUser(
    projectId: Signal<number | string>,
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
    projectId: Signal<number | string>,
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

  removeProjectUser(projectId: Signal<number | string>, userId?: number) {
    if (!userId) {
      return Promise.reject(new Error('User ID is required'));
    }

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
    projectId: Signal<number | string>;
    registrationReferenceId: string;
    note: string;
  }): Promise<unknown> {
    return this.httpWrapperService.perform121ServiceRequest<Project>({
      method: 'POST',
      endpoint: `${BASE_ENDPOINT}/${projectId().toString()}/registrations/${registrationReferenceId}/notes`,
      body: {
        text: note,
      },
    });
  }

  getIntersolveVoucher({
    projectId,
    voucherReferenceId,
    paymentId,
  }: {
    projectId: Signal<number | string>;
    voucherReferenceId: string;
    paymentId: number | string;
  }) {
    return this.generateQueryOptions<Blob>({
      path: [
        BASE_ENDPOINT,
        projectId,
        'financial-service-providers/intersolve-voucher/vouchers',
      ],
      params: {
        referenceId: voucherReferenceId,
        payment: paymentId.toString(),
      },
      responseAsBlob: true,
    });
  }

  getIntersolveVoucherBalance({
    projectId,
    registrationReferenceId,
    paymentId,
  }: {
    projectId: Signal<number | string>;
    registrationReferenceId: string;
    paymentId: number | string;
  }) {
    return this.generateQueryOptions<number>({
      path: [
        BASE_ENDPOINT,
        projectId,
        'financial-service-providers/intersolve-voucher/vouchers/balance',
      ],
      params: {
        referenceId: registrationReferenceId,
        payment: paymentId,
      },
    });
  }

  getCbeVerificationReport(projectId: Signal<number | string>) {
    return this.generateQueryOptions<
      Dto<CommercialBankEthiopiaValidationReportDto>
    >({
      path: [
        BASE_ENDPOINT,
        projectId,
        'financial-service-providers/commercial-bank-ethiopia/account-enquiries',
      ],
    });
  }

  getLatestAction({
    projectId,
    actionType,
  }: {
    projectId: Signal<number | string>;
    actionType: ExportType;
  }) {
    return this.generateQueryOptions<Dto<ActionReturnDto>>({
      path: [BASE_ENDPOINT, projectId, 'actions'],
      params: {
        actionType,
      },
    });
  }

  public invalidateCache(projectId?: Signal<number | string>): Promise<void> {
    const path: (Signal<number | string> | string)[] = [BASE_ENDPOINT];

    if (projectId) {
      path.push(projectId);
    }

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
