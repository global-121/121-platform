import { HttpParamsOptions } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';

import { queryOptions } from '@tanstack/angular-query-experimental';
import { unique } from 'radashi';

import { CommercialBankEthiopiaValidationReportDto } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-validation-report.dto';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  Attribute,
  AttributeWithTranslatedLabel,
  Program,
  ProgramAttachment,
  ProgramAttachmentFileType,
  ProgramUser,
  ProgramUserAssignment,
  ProgramUserWithRolesLabel,
} from '~/domains/program/program.model';
import {
  ATTRIBUTE_LABELS,
  isGenericAttribute,
} from '~/domains/program/program-attribute.helpers';
import { Role } from '~/domains/role/role.model';
import { TransactionEventsResponse } from '~/domains/transaction/transaction.model';
import { AuthService } from '~/services/auth.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = 'programs';

const filterableAttributesToIgnore = [
  'failedPayment',
  'waitingPayment',
  'successPayment',
  'notYetSentPayment',
  // Below attributes are already hardcoded in the table columns service
  'programFspConfigurationName',
  'fullName',
  'created',
  'registrationCreatedDate',
];

@Injectable({
  providedIn: 'root',
})
export class ProgramApiService extends DomainApiService {
  private readonly authService = inject(AuthService);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  createProgram(newProgram: Dto<CreateProgramDto>) {
    return this.httpWrapperService.perform121ServiceRequest<
      Program | undefined
    >({
      method: 'POST',
      endpoint: BASE_ENDPOINT,
      body: newProgram,
    });
  }

  getProgram(programId: Signal<number | string | undefined>) {
    return this.generateQueryOptions<Program>({
      path: [BASE_ENDPOINT, programId],
      enabled: () => !!programId(),
      processResponse: (program) => {
        if (program.filterableAttributes) {
          program.filterableAttributes = program.filterableAttributes.map(
            (group) => ({
              ...group,
              filters: group.filters.filter(
                (filter) => !filterableAttributesToIgnore.includes(filter.name),
              ),
            }),
          );
        }

        return program;
      },
    });
  }

  getProgramUsers(programId: Signal<number | string>) {
    return this.generateQueryOptions<
      ProgramUser[],
      ProgramUserWithRolesLabel[]
    >({
      path: [BASE_ENDPOINT, programId, 'users'],
      processResponse: (users) => {
        const usersWithRolesLabel: ProgramUserWithRolesLabel[] = users.map(
          (user) => ({
            ...user,
            allRolesLabel: user.roles.map((role) => role.label).join('; '),
          }),
        );

        return usersWithRolesLabel;
      },
    });
  }

  getUserSearchResults(
    programId: Signal<number | string>,
    searchQuery: Signal<string>,
  ) {
    return this.generateQueryOptions<ProgramUser[]>({
      path: [BASE_ENDPOINT, programId, 'users', 'search'],
      params: {
        username: searchQuery,
      },
    });
  }

  getProgramAttachments(programId: Signal<number | string>) {
    return this.generateQueryOptions<
      Omit<ProgramAttachment, 'fileType'>[],
      ProgramAttachment[]
    >({
      path: [BASE_ENDPOINT, programId, 'attachments'],
      processResponse: (attachments) =>
        attachments.map((attachment) => {
          const mimetype = attachment.mimetype;

          const fileType = mimetype.startsWith('image/')
            ? ProgramAttachmentFileType.IMAGE
            : mimetype === 'application/pdf'
              ? ProgramAttachmentFileType.PDF
              : ProgramAttachmentFileType.DOCUMENT;

          return {
            ...attachment,
            fileType,
          };
        }),
    });
  }

  updateProgram({
    programId,
    programPatch,
  }: {
    programId: Signal<number | string>;
    programPatch: Dto<UpdateProgramDto>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'PATCH',
      endpoint: `${BASE_ENDPOINT}/${programId().toString()}`,
      body: programPatch,
    });
  }

  removeProgramAttachment({
    programId,
    attachmentId,
  }: {
    programId: Signal<number | string>;
    attachmentId: number;
  }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'DELETE',
      endpoint: this.pathToQueryKey([
        BASE_ENDPOINT,
        programId,
        'attachments',
        attachmentId,
      ]).join('/'),
    });
  }

  downloadProgramAttachment({
    programId,
    attachmentId,
  }: {
    programId: Signal<number | string>;
    attachmentId: number;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<Blob>({
      method: 'GET',
      endpoint: this.pathToQueryKey([
        BASE_ENDPOINT,
        programId,
        'attachments',
        attachmentId,
      ]).join('/'),
      responseAsBlob: true,
    });
  }

  uploadProgramAttachment({
    programId,
    file,
    filename,
  }: {
    programId: Signal<number | string>;
    file: File;
    filename: string;
  }) {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('filename', filename);

    return this.httpWrapperService.perform121ServiceRequest<unknown>({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        BASE_ENDPOINT,
        programId,
        'attachments',
      ]).join('/'),
      body: formData,
      isUpload: true,
    });
  }

  getProgramAttributes({
    programId,
    includeProgramRegistrationAttributes = false,
    includeTemplateDefaultAttributes = false,
    filterShowInRegistrationsTable = false,
  }: {
    programId: Signal<number | string>;
    includeProgramRegistrationAttributes?: boolean;
    includeTemplateDefaultAttributes?: boolean;
    filterShowInRegistrationsTable?: boolean;
  }) {
    return this.generateQueryOptions<
      Attribute[],
      AttributeWithTranslatedLabel[]
    >({
      path: [BASE_ENDPOINT, programId, 'attributes'],
      params: {
        includeProgramRegistrationAttributes,
        includeTemplateDefaultAttributes,
        filterShowInRegistrationsTable,
      },
      processResponse: (attributes) =>
        unique(attributes, (attribute) => attribute.name).map((attribute) => {
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
        }),
    });
  }

  assignProgramUser(
    programId: Signal<number | string>,
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
    return this.httpWrapperService.perform121ServiceRequest<ProgramUserAssignment>(
      {
        method: 'PUT',
        endpoint: `${BASE_ENDPOINT}/${programId().toString()}/users/${userId.toString()}`,
        body: {
          roles,
          scope,
        },
      },
    );
  }

  updateProgramUserAssignment(
    programId: Signal<number | string>,
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
    return this.httpWrapperService.perform121ServiceRequest<ProgramUserAssignment>(
      {
        method: 'PATCH',
        endpoint: `${BASE_ENDPOINT}/${programId().toString()}/users/${userId.toString()}`,
        body: {
          rolesToAdd: roles,
          scope,
        },
      },
    );
  }

  removeProgramUser(programId: Signal<number | string>, userId?: number) {
    if (!userId) {
      return Promise.reject(new Error('User ID is required'));
    }

    return this.httpWrapperService.perform121ServiceRequest<Program>({
      method: 'DELETE',
      endpoint: `${BASE_ENDPOINT}/${programId().toString()}/users/${userId.toString()}`,
    });
  }

  addRegistrationNote({
    programId,
    registrationReferenceId,
    note,
  }: {
    programId: Signal<number | string>;
    registrationReferenceId: string;
    note: string;
  }): Promise<unknown> {
    return this.httpWrapperService.perform121ServiceRequest<Program>({
      method: 'POST',
      endpoint: `${BASE_ENDPOINT}/${programId().toString()}/registrations/${registrationReferenceId}/notes`,
      body: {
        text: note,
      },
    });
  }

  getIntersolveVoucher({
    programId,
    referenceId,
    paymentId,
    fsp,
  }: {
    programId: Signal<number | string>;
    referenceId: string;
    paymentId: number | string;
    fsp: Fsps;
  }) {
    const voucherType =
      fsp === Fsps.intersolveVoucherPaper ? 'paper' : 'whatsapp';

    return this.generateQueryOptions<Blob>({
      path: [
        BASE_ENDPOINT,
        programId,
        `fsps/intersolve-voucher/voucher-${voucherType}`,
      ],
      params: {
        referenceId,
        paymentId: paymentId.toString(),
      },
      responseAsBlob: true,
    });
  }

  getIntersolveVoucherBalance({
    programId,
    registrationReferenceId,
    paymentId,
  }: {
    programId: Signal<number | string>;
    registrationReferenceId: string;
    paymentId: number | string;
  }) {
    return this.generateQueryOptions<number>({
      path: [
        BASE_ENDPOINT,
        programId,
        'fsps/intersolve-voucher/vouchers/balance',
      ],
      params: {
        referenceId: registrationReferenceId,
        paymentId,
      },
    });
  }

  getCbeVerificationReport(programId: Signal<number | string>) {
    return this.generateQueryOptions<
      Dto<CommercialBankEthiopiaValidationReportDto>
    >({
      path: [
        BASE_ENDPOINT,
        programId,
        'fsps/commercial-bank-ethiopia/accounts',
      ],
    });
  }

  getTransactions({
    programId,
    params,
  }: {
    programId: Signal<number | string>;
    params: HttpParamsOptions['fromObject'];
  }) {
    return this.generateQueryOptions<Blob>({
      path: [BASE_ENDPOINT, programId, 'transactions'],
      params,
      responseAsBlob: true,
    });
  }

  getTransactionEvents({
    programId,
    transactionId,
  }: {
    programId: Signal<number | string>;
    transactionId: Signal<number | string>;
  }) {
    return this.generateQueryOptions<TransactionEventsResponse>({
      path: [BASE_ENDPOINT, programId, 'transactions', transactionId, 'events'],
    });
  }

  getAssignedPrograms() {
    return () => {
      const programIds = this.authService.getAssignedProgramIds();

      return queryOptions({
        queryKey: [BASE_ENDPOINT, 'assignedPrograms', programIds],
        queryFn: async () => {
          const programs = await Promise.all(
            programIds.map((programId) =>
              this.queryClient.fetchQuery<Program>(
                this.getProgram(signal(programId))(),
              ),
            ),
          );

          const result: Record<number, Program | undefined> = {};

          return programs.reduce(
            (acc, program) => ({ ...acc, [program.id]: program }),
            result,
          );
        },
      });
    };
  }

  public invalidateCache(programId?: Signal<number | string>): Promise<void> {
    const path: (Signal<number | string> | string)[] = [BASE_ENDPOINT];

    if (programId) {
      path.push(programId);
    }

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
