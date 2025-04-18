import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth/auth.service';
import Permission from '../auth/permission.enum';
import {
  PersonDefaultAttributes,
  PersonTableColumn,
} from '../models/person.model';
import { Program } from '../models/program.model';
import { RegistrationAttributeType } from '../models/registration-attribute.model';
import { TranslatableString } from '../models/translatable-string.model';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { TranslatableStringService } from './translatable-string.service';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private columnWidthPerType = {
    [RegistrationAttributeType.Number]: 90,
    [RegistrationAttributeType.Date]: 180,
    [RegistrationAttributeType.PhoneNumber]: 130,
    [RegistrationAttributeType.Text]: 150,
    [RegistrationAttributeType.Enum]: 160,
    [RegistrationAttributeType.Email]: 180,
    [RegistrationAttributeType.Boolean]: 90,
    [RegistrationAttributeType.MultiSelect]: 180,
  };

  private columnsWithSpecialFormatting = [
    'lastMessageStatus',
    'name',
    'status',
  ];

  constructor(
    private translate: TranslateService,
    private platform: Platform,
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    private translatableStringService: TranslatableStringService,
  ) {}

  public getColumnDefaults() {
    return {
      draggable: false,
      resizeable: false,
      sortable: true,
      comparator: undefined,
      frozenLeft: false,
      permissions: [Permission.RegistrationREAD],
      showIfNoValidation: true,
      headerClass: 'ion-text-wrap ion-align-self-end',
    };
  }

  private paComparator(a: string, b: string) {
    // Use numeric sorting for 'text'-values, so the order will be: "PA #1" < "PA #2" < "PA #10"
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  public getStandardColumns(): PersonTableColumn[] {
    return [
      {
        prop: 'phoneNumber',
        name: this.translate.instant(
          'page.program.program-people-affected.column.phoneNumber',
        ),
        ...this.getColumnDefaults(),
        frozenLeft: this.platform.width() > 1280,
        permissions: [Permission.RegistrationPersonalREAD],
        minWidth:
          this.columnWidthPerType[RegistrationAttributeType.PhoneNumber],
        width: this.columnWidthPerType[RegistrationAttributeType.PhoneNumber],
      },
      {
        prop: 'preferredLanguage',
        name: this.translate.instant(
          'page.program.program-people-affected.column.preferredLanguage',
        ),
        ...this.getColumnDefaults(),
        sortable: false, // TODO: disabled, because sorting in the backend is does on values (nl/en) instead of frontend labels (Dutch/English)
        permissions: [Permission.RegistrationPersonalREAD],
        minWidth: this.columnWidthPerType[RegistrationAttributeType.Text],
        width: this.columnWidthPerType[RegistrationAttributeType.Text],
      },
      {
        prop: 'status',
        name: this.translate.instant(
          'page.program.program-people-affected.column.status',
        ),
        ...this.getColumnDefaults(),
        minWidth: 135,
        width: 135,
        frozenLeft: this.platform.width() > 1280,
      },
      {
        prop: 'created',
        name: this.translate.instant(
          'page.program.program-people-affected.column.created',
        ),
        ...this.getColumnDefaults(),
        minWidth: this.columnWidthPerType[RegistrationAttributeType.Date],
        width: this.columnWidthPerType[RegistrationAttributeType.Date],
      },
      {
        prop: 'paymentAmountMultiplier',
        name: this.translate.instant(
          'page.program.program-people-affected.column.paymentAmountMultiplier',
        ),
        ...this.getColumnDefaults(),
        comparator: this.paComparator.bind(this),
        minWidth: this.columnWidthPerType[RegistrationAttributeType.Number],
        width: this.columnWidthPerType[RegistrationAttributeType.Number],
      },
      {
        prop: 'maxPayments',
        name: this.translate.instant(
          'page.program.program-people-affected.column.maxPayments',
        ),
        ...this.getColumnDefaults(),
        minWidth: 150,
        width: 150,
      },
      {
        prop: 'financialServiceProvider',
        name: this.translate.instant(
          'page.program.program-people-affected.column.programFinancialServiceProviderConfigurationLabel',
        ),
        ...this.getColumnDefaults(),
        minWidth: 220,
        width: 220,
      },
      {
        prop: 'lastMessageStatus',
        name: this.translate.instant(
          'page.program.program-people-affected.column.lastMessageStatus',
        ),
        ...this.getColumnDefaults(),
        permissions: [Permission.RegistrationNotificationREAD],
        minWidth: 200,
        width: 200,
      },
    ];
  }

  public getColumnWidthPerType() {
    return this.columnWidthPerType;
  }

  public async loadColumns(
    program: Program,
    canViewPersonalData: boolean,
  ): Promise<PersonTableColumn[]> {
    const columns: PersonTableColumn[] = [];
    columns.push(...this.loadNameColumns(program, canViewPersonalData));
    for (const column of this.getStandardColumns()) {
      if (
        this.authService.hasAllPermissions(program.id, column.permissions) &&
        this.checkValidationColumnOrAction(column, program.validation) &&
        this.showMaxPaymentsColumn(column, program.enableMaxPayments)
      ) {
        columns.push(column);
      }
    }

    const columnsPerPhase = await this.programsService.getPaTableAttributes(
      program.id,
    );

    if (!columnsPerPhase) {
      return columns;
    }

    for (const colPerPhase of columnsPerPhase) {
      // Skip dynamic columns that are already added as default column
      if (
        colPerPhase.name === PersonDefaultAttributes.phoneNumber ||
        program.fullnameNamingConvention.includes(colPerPhase.name)
      ) {
        continue;
      }

      const addCol: any = {
        prop: colPerPhase.name,
        name: this.createColumnNameLabel(colPerPhase.name, colPerPhase.label),
        ...this.getColumnDefaults,
        permissions: [Permission.RegistrationPersonalREAD],
        headerClass: 'ion-align-self-end header-overflow-ellipsis',
      };
      if (this.getColumnWidthPerType()[colPerPhase.type]) {
        addCol.minWidth = this.getColumnWidthPerType()[colPerPhase.type];
        addCol.width = this.getColumnWidthPerType()[colPerPhase.type];
      } else {
        addCol.minWidth = this.getColumnWidthPerType().text;
        addCol.width = this.getColumnWidthPerType().text;
      }
      if (this.authService.hasAllPermissions(program.id, addCol.permissions)) {
        columns.push(addCol);
      }
    }

    return columns;
  }

  private createColumnNameLabel(
    columnName: string,
    columnShortlLabel?: TranslatableString,
  ): string {
    if (columnShortlLabel) {
      return this.translatableStringService.get(columnShortlLabel);
    }

    return this.translate.instant(
      `page.program.program-people-affected.column.${columnName}`,
    );
  }

  private loadNameColumns(
    program: Program,
    canViewPersonalData: boolean,
  ): PersonTableColumn[] {
    const columns: PersonTableColumn[] = [];

    if (canViewPersonalData) {
      for (const nameColumn of program.fullnameNamingConvention) {
        const searchableColumns = program.programRegistrationAttributes;

        const nameAttribute = searchableColumns.find(
          (attribute) => attribute.name === nameColumn,
        );
        if (nameAttribute) {
          const addCol = {
            prop: nameColumn,
            name: this.translatableStringService.get(nameAttribute.label),
            ...this.getColumnDefaults(),
            frozenLeft: this.platform.width() > 768,
            permissions: [Permission.RegistrationPersonalREAD],
            minWidth:
              this.getColumnWidthPerType()[RegistrationAttributeType.Text],
            width: this.getColumnWidthPerType()[RegistrationAttributeType.Text],
          };
          columns.push(addCol);
        }
      }
    }

    return columns;
  }

  public createPaymentHistoryColumn(): PersonTableColumn {
    return {
      prop: 'paymentHistory',
      name: this.translate.instant(
        'page.program.program-people-affected.column.payment-history',
      ),
      ...this.getColumnDefaults(),
      sortable: false,
      permissions: [Permission.RegistrationPersonalREAD],
      minWidth: 200,
      width: 200,
    };
  }

  private checkValidationColumnOrAction(
    column: PersonTableColumn,
    validation: boolean,
  ) {
    return (column.showIfNoValidation && !validation) || validation;
  }

  private showMaxPaymentsColumn(
    column: PersonTableColumn,
    enableMaxPayments: boolean,
  ): boolean {
    return (
      column.prop !== 'maxPayments' ||
      (column.prop === 'maxPayments' && enableMaxPayments)
    );
  }

  public isColumnWithSpecialFormatting(column: string): boolean {
    return this.columnsWithSpecialFormatting.includes(column);
  }
}
