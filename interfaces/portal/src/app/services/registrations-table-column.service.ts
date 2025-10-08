import { inject, Injectable, Signal, signal } from '@angular/core';

import {
  QueryClient,
  queryOptions,
} from '@tanstack/angular-query-experimental';

import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import {
  getChipDataByDuplicateStatus,
  getChipDataByRegistrationStatus,
} from '~/components/colored-chip/colored-chip.helper';
import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Program } from '~/domains/program/program.model';
import {
  DUPLICATE_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  registrationLink,
} from '~/domains/registration/registration.helper';
import { Registration } from '~/domains/registration/registration.model';
import {
  NormalizedRegistrationAttribute,
  RegistrationAttributeService,
} from '~/services/registration-attribute.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

const FILTERABLE_ATTRIBUTES_LABELS: Record<string, string> = {
  paymentCount: $localize`:@@payment-count:Number of payments`,
  paymentCountRemaining: $localize`:@@payment-count-remaining:Remaining payments`,
  maxPayments: $localize`:@@max-payments:Max payments`,
  lastMessageStatus: $localize`:@@last-message-status:Last message status`,
  duplicateStatus: $localize`:@@duplicate-status:Duplicates`,
};

const DEFAULT_VISIBLE_FIELDS_SORTED: string[] = [
  'registrationProgramId',
  'name',
  'status',
  'duplicateStatus',
  'phoneNumber',
  'paymentCount',
  'maxPayments',
  'created',
];

type FilterableGroup = Required<Program>['filterableAttributes'][number];

@Injectable({
  providedIn: 'root',
})
export class RegistrationsTableColumnService {
  private readonly queryClient = inject(QueryClient);

  private readonly programApiService = inject(ProgramApiService);
  private readonly registrationAttributeService = inject(
    RegistrationAttributeService,
  );
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  /**
   * Get the columns for the registrations table.
   * @param programId Signal containing the program ID
   * @returns Query options for the columns
   */
  getColumns(programId: Signal<number | string>) {
    return () =>
      queryOptions<QueryTableColumn<Registration>[]>({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps -- eslint is complaining about missing programId for some reason but it's wrong
        queryKey: ['RegistrationsTableColumns', programId().toString()],
        queryFn: async () => {
          const program = await this.queryClient.fetchQuery(
            this.programApiService.getProgram(programId)(),
          );

          const registrationAttributes = await this.queryClient.fetchQuery(
            this.registrationAttributeService.getRegistrationAttributes(
              signal({
                programId,
              }),
            )(),
          );

          const basicColumns = this.createBasicColumns(program);
          const scopeColumns = this.createScopeColumns(program);
          const programSpecificColumns = this.createProgramSpecificColumns(
            program,
            registrationAttributes,
          );

          const allColumns = [
            ...basicColumns,
            ...scopeColumns,
            ...programSpecificColumns,
          ];

          return this.processColumns(allColumns);
        },
      });
  }

  private createBasicColumns(
    program: Program,
  ): QueryTableColumn<Registration>[] {
    return [
      {
        field: 'registrationProgramId',
        header: $localize`Reg. #`,
        getCellText: (registration) =>
          `Reg. #${registration.registrationProgramId.toString()}`,
        getCellRouterLink: (registration) =>
          registrationLink({
            programId: program.id,
            registrationId: registration.id,
          }),
        type: QueryTableColumnType.NUMERIC,
      },
      {
        field: 'referenceId',
        header: $localize`Reference ID`,
        type: QueryTableColumnType.TEXT,
      },
      {
        field: 'name',
        header: $localize`:@@registration-full-name:Name`,
        getCellRouterLink: (registration) =>
          registrationLink({
            programId: program.id,
            registrationId: registration.id,
          }),
        fieldForFilter: 'fullName',
        fieldForSort: 'fullName',
      },
      {
        field: 'status',
        header: $localize`:@@registration-status:Registration Status`,
        type: QueryTableColumnType.MULTISELECT,
        options: Object.values(RegistrationStatusEnum)
          .filter((status) => status !== RegistrationStatusEnum.deleted)
          .map((status) => ({
            label: REGISTRATION_STATUS_LABELS[status],
            value: status,
          })),
        displayAsChip: true,
        getCellChipData: (registration) =>
          getChipDataByRegistrationStatus(registration.status),
      },
      {
        field: 'duplicateStatus',
        header: $localize`:@@registration-duplicates:Duplicates`,
        type: QueryTableColumnType.MULTISELECT,
        options: Object.values(DuplicateStatus).map((status) => ({
          label: DUPLICATE_STATUS_LABELS[status],
          value: status,
        })),
        displayAsChip: true,
        getCellChipData: (registration) =>
          getChipDataByDuplicateStatus(registration.duplicateStatus),
      },
      {
        field: 'programFspConfigurationName',
        header: $localize`FSP`,
        type: QueryTableColumnType.MULTISELECT,
        options: program.programFspConfigurations.map((config) => ({
          label: this.translatableStringService.translate(config.label) ?? '',
          value: config.name,
        })),
        displayAsChip: true,
      },
      {
        field: 'created',
        header: $localize`:@@registration-created:Registration created`,
        type: QueryTableColumnType.DATE,
        defaultHidden: true,
      },
    ];
  }

  private createScopeColumns(
    program: Program,
  ): QueryTableColumn<Registration>[] {
    if (!program.enableScope) {
      return [];
    }

    return [
      {
        field: 'scope',
        header: $localize`:@@registration-scope:Scope`,
        type: QueryTableColumnType.TEXT,
        defaultHidden: true,
        disableFiltering: true,
        disableSorting: true,
      },
    ];
  }

  private createProgramSpecificColumns(
    program: Program,
    registrationAttributes: NormalizedRegistrationAttribute[],
  ): QueryTableColumn<Registration>[] {
    if (!program.filterableAttributes) {
      return [];
    }

    const columns: QueryTableColumn<Registration>[] = [];

    for (const filterableGroup of program.filterableAttributes) {
      if (filterableGroup.group === 'paAttributes') {
        columns.push(
          ...this.createPaAttributeColumns(
            filterableGroup,
            registrationAttributes,
          ),
        );
      } else {
        columns.push(...this.createNonPaAttributeColumns(filterableGroup));
      }
    }

    return columns;
  }

  private createPaAttributeColumns(
    filterableGroup: FilterableGroup,
    registrationAttributes: NormalizedRegistrationAttribute[],
  ): QueryTableColumn<Registration>[] {
    const columns: QueryTableColumn<Registration>[] = [];

    for (const filterableAttribute of filterableGroup.filters) {
      const foundAttribute = registrationAttributes.find(
        (ra) => ra.name === filterableAttribute.name,
      );

      if (foundAttribute) {
        columns.push({
          field: foundAttribute.name,
          header:
            this.translatableStringService.translate(foundAttribute.label) ??
            foundAttribute.name,
          type: this.mapAttributeTypeToQueryTableColumnType(foundAttribute),
          options:
            foundAttribute.options?.map((option) => ({
              label: option.label ?? '',
              value: option.value,
            })) ?? [],
          defaultHidden: true,
        });
      }
    }

    return columns;
  }

  private createNonPaAttributeColumns(
    filterableGroup: FilterableGroup,
  ): QueryTableColumn<Registration>[] {
    return filterableGroup.filters.map((filterableAttribute) => ({
      field: filterableAttribute.name,
      header: FILTERABLE_ATTRIBUTES_LABELS[filterableAttribute.name],
      defaultHidden: true,
      type: filterableAttribute.isInteger
        ? QueryTableColumnType.NUMERIC
        : QueryTableColumnType.TEXT,
    }));
  }

  private processColumns(
    columns: QueryTableColumn<Registration>[],
  ): QueryTableColumn<Registration>[] {
    return columns
      .map((column) => {
        // undefined indicates: use default text rendering (used for non-numeric columns).
        let getCellText: ((registration: Registration) => string) | undefined;

        if (column.type === QueryTableColumnType.NUMERIC) {
          getCellText = (registration: Registration) => {
            if (registration[column.field] === null) {
              return '';
            }

            return registration[column.field] as string;
          };
        }

        return {
          ...column,
          defaultHidden: !DEFAULT_VISIBLE_FIELDS_SORTED.includes(column.field),
          getCellText,
        };
      })
      .sort(this.sortColumnsByDefaultOrder.bind(this));
  }

  private sortColumnsByDefaultOrder(
    a: QueryTableColumn<Registration>,
    b: QueryTableColumn<Registration>,
  ): number {
    const aIndex = DEFAULT_VISIBLE_FIELDS_SORTED.indexOf(a.field);
    const bIndex = DEFAULT_VISIBLE_FIELDS_SORTED.indexOf(b.field);

    if (aIndex === -1 && bIndex === -1) {
      return 0;
    }
    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }
    return aIndex - bIndex;
  }

  private mapAttributeTypeToQueryTableColumnType(
    attribute: NormalizedRegistrationAttribute,
  ) {
    switch (attribute.type) {
      case RegistrationAttributeTypes.tel:
      case RegistrationAttributeTypes.text:
      case RegistrationAttributeTypes.boolean:
        return QueryTableColumnType.TEXT;
      case RegistrationAttributeTypes.numeric:
      case RegistrationAttributeTypes.numericNullable:
        return QueryTableColumnType.NUMERIC;
      case RegistrationAttributeTypes.date:
        return QueryTableColumnType.DATE;
      case RegistrationAttributeTypes.dropdown:
      case RegistrationAttributeTypes.multiSelect:
        return QueryTableColumnType.MULTISELECT;
    }
  }
}
