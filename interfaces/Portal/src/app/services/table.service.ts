import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth/auth.service';
import Permission from '../auth/permission.enum';
import { AnswerType } from '../models/fsp.model';
import {
  PersonDefaultAttributes,
  PersonTableColumn,
} from '../models/person.model';
import { Program, ProgramPhase } from '../models/program.model';
import { TranslatableString } from '../models/translatable-string.model';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { TranslatableStringService } from './translatable-string.service';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private columnWidthPerType = {
    [AnswerType.Number]: 90,
    [AnswerType.Date]: 180,
    [AnswerType.PhoneNumber]: 130,
    [AnswerType.Text]: 150,
    [AnswerType.Enum]: 160,
    [AnswerType.Email]: 180,
    [AnswerType.Boolean]: 90,
    [AnswerType.MultiSelect]: 180,
  };

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
      phases: [
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.payment,
      ],
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
        minWidth: this.columnWidthPerType[AnswerType.PhoneNumber],
        width: this.columnWidthPerType[AnswerType.PhoneNumber],
      },
      {
        prop: 'preferredLanguage',
        name: this.translate.instant(
          'page.program.program-people-affected.column.preferredLanguage',
        ),
        ...this.getColumnDefaults(),
        sortable: false, // TODO: disabled, because sorting in the backend is does on values (nl/en) instead of frontend labels (Dutch/English)
        permissions: [Permission.RegistrationPersonalREAD],
        minWidth: this.columnWidthPerType[AnswerType.Text],
        width: this.columnWidthPerType[AnswerType.Text],
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
        prop: 'registrationCreated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.registrationCreated',
        ),
        ...this.getColumnDefaults(),
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.payment,
        ],
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'paymentAmountMultiplier',
        name: this.translate.instant(
          'page.program.program-people-affected.column.paymentAmountMultiplier',
        ),
        ...this.getColumnDefaults(),
        comparator: this.paComparator.bind(this),
        minWidth: this.columnWidthPerType[AnswerType.Number],
        width: this.columnWidthPerType[AnswerType.Number],
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
          'page.program.program-people-affected.column.fspDisplayName',
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
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.payment,
        ],
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
    thisPhase: ProgramPhase,
    program: Program,
    canViewPersonalData: boolean,
  ): Promise<PersonTableColumn[]> {
    const columns: PersonTableColumn[] = [];
    columns.push(...this.loadNameColumns(program, canViewPersonalData));
    for (const column of this.getStandardColumns()) {
      if (
        column.phases.includes(thisPhase) &&
        this.authService.hasAllPermissions(program.id, column.permissions) &&
        this.checkValidationColumnOrAction(column, program.validation) &&
        this.showMaxPaymentsColumn(column, program.enableMaxPayments)
      ) {
        columns.push(column);
      }
    }

    const columnsPerPhase = await this.programsService.getPaTableAttributes(
      program.id,
      { phase: thisPhase },
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
        name: this.createColumnNameLabel(
          colPerPhase.name,
          colPerPhase.shortLabel,
        ),
        ...this.getColumnDefaults,
        permissions: [Permission.RegistrationPersonalREAD],
        phases: colPerPhase.phases,
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
        const searchableColumns = [
          ...program.programQuestions,
          ...program.programCustomAttributes,
        ];

        const nameQuestion = searchableColumns.find(
          (question) => question.name === nameColumn,
        );
        if (nameQuestion) {
          const addCol = {
            prop: nameColumn,
            name: this.translatableStringService.get(
              nameQuestion.shortLabel || nameQuestion.label,
            ),
            ...this.getColumnDefaults(),
            frozenLeft: this.platform.width() > 768,
            permissions: [Permission.RegistrationPersonalREAD],
            minWidth: this.getColumnWidthPerType()[AnswerType.Text],
            width: this.getColumnWidthPerType()[AnswerType.Text],
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
      phases: [ProgramPhase.payment],
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
}
