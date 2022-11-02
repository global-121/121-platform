import { formatDate } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { ProgramMetrics } from 'src/app/models/program-metrics.model';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { getValueOrUnknown } from 'src/app/shared/get-value-helpers';
import { environment } from '../../../environments/environment';
import RegistrationStatus from '../../enums/registration-status.enum';
import { PastPaymentsService } from '../../services/past-payments.service';

@Component({
  selector: 'app-metrics-states',
  templateUrl: './metrics-states.component.html',
  styleUrls: ['./metrics-states.component.scss'],
})
export class MetricsStatesComponent implements OnChanges {
  @Input()
  private program: Program;

  public lastUpdated: Date | string;

  public paStates: {
    name: RegistrationStatus;
    enabled: boolean;
    label: string;
    explanation?: string;
    toDate: number;
    forPayment?: number;
    forPaymentFromStart?: number;
    forMonth?: number;
    forMonthFromStart?: number;
  }[] = [];

  public pastPayments: {
    id: number;
    date: Date | string;
    value: string;
  }[];
  public chosenPayment: any;

  public pastMonths: {
    date: Date | string;
    value: string;
  }[];
  public chosenMonth: any;

  private programMetrics: ProgramMetrics;

  constructor(
    private translate: TranslateService,
    private programService: ProgramsServiceApiService,
    private pastPaymentsService: PastPaymentsService,
  ) {}

  public async ngOnChanges(changes: SimpleChanges) {
    if (changes.program && typeof changes.program.currentValue === 'object') {
      this.update();
    }
  }

  public async update() {
    this.programMetrics = await this.programService.getMetricsById(
      this.program.id,
    );

    this.renderUpdated();
    this.createPaStateColumns();

    await this.createPastPaymentsOptions();
    this.loadDataByCondition(this.chosenPayment, 'forPayment');
    this.loadDataByCondition(
      this.chosenPayment + '&fromStart=1',
      'forPaymentFromStart',
    );

    await this.createPastMonthsOptions();
    this.loadDataByCondition(this.chosenMonth, 'forMonth');
    this.loadDataByCondition(
      this.chosenMonth + '&fromStart=1',
      'forMonthFromStart',
    );
  }

  private renderUpdated() {
    this.lastUpdated = getValueOrUnknown(this.programMetrics.updated);
  }

  private createPaStateColumns() {
    this.paStates = [
      {
        name: RegistrationStatus.imported,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.imported'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.imported',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.imported],
      },
      {
        name: RegistrationStatus.invited,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.invited'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.invited',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.invited],
      },
      {
        name: RegistrationStatus.noLongerEligible,
        enabled: true,
        label: this.translate.instant(
          'page.program.metrics.pa.noLongerEligible',
        ),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.noLongerEligible',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.noLongerEligible],
      },
      {
        name: RegistrationStatus.startedRegistration,
        enabled: true,
        label: this.translate.instant(
          'page.program.metrics.pa.startedRegistration',
        ),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.startedRegistration',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.startedRegistration],
      },
      {
        name: RegistrationStatus.registered,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.registered'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.registered',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.registered],
      },
      {
        name: RegistrationStatus.selectedForValidation,
        enabled: this.program.validation,
        label: this.translate.instant(
          'page.program.metrics.pa.selectedForValidation',
        ),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.selectedForValidation',
        ),
        toDate:
          this.programMetrics.pa[RegistrationStatus.selectedForValidation],
      },
      {
        name: RegistrationStatus.validated,
        enabled: this.program.validation,
        label: this.translate.instant('page.program.metrics.pa.validated'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.validated',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.validated],
      },
      {
        name: RegistrationStatus.included,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.included'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.included',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.included],
      },
      {
        name: RegistrationStatus.inclusionEnded,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.inclusionEnded'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.inclusionEnded',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.inclusionEnded],
      },
      {
        name: RegistrationStatus.rejected,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.rejected'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.rejected',
        ),
        toDate: this.programMetrics.pa[RegistrationStatus.rejected],
      },
    ];
    // Filter out disabled collumns:
    this.paStates = this.paStates.filter((col) => col.enabled);
  }

  private async createPastPaymentsOptions() {
    const pastPayments = await this.pastPaymentsService.getPaymentsWithDates(
      this.program.id,
    );

    this.pastPayments = pastPayments.map((payment) => {
      return {
        id: payment.id,
        date: payment.date,
        value: 'payment=' + payment.id,
      };
    });

    if (this.pastPayments.length) {
      this.chosenPayment = this.pastPayments[0].value;
    }
  }

  private async createPastMonthsOptions() {
    const pastYearMonths = await this.pastPaymentsService.getPaymentYearMonths(
      this.program.id,
    );

    this.pastMonths = pastYearMonths.map((item) => {
      const date = new Date(item.date);
      return {
        date,
        value: `year=${date.getFullYear()}&month=${date.getMonth()}`,
      };
    });
    if (this.pastMonths.length) {
      this.chosenMonth = this.pastMonths[0].value;
    }
  }

  private async loadDataByCondition(condition: string, destination: string) {
    this.programMetrics = await this.programService.getMetricsByIdWithCondition(
      this.program.id,
      condition,
    );

    this.paStates.map((item) => {
      item[destination] = this.programMetrics.pa[item.name];
      return item;
    });
  }

  private resetData(destination: string) {
    this.paStates.map((item) => {
      item[destination] = null;
      return item;
    });
  }

  public changeDataset(
    condition: string,
    destination: 'forPayment' | 'forMonth',
  ) {
    if (condition === '') {
      this.resetData(destination);
      this.resetData(destination + 'FromStart');
      return;
    }
    this.loadDataByCondition(condition, destination);
    this.loadDataByCondition(
      condition + '&fromStart=1',
      destination + 'FromStart',
    );
    this.renderUpdated();
  }

  public exportCSV() {
    const rowHeader = (headerName) =>
      this.translate.instant(
        `page.program.metrics.timeframe.${headerName}.label`,
      );

    let chosenMonthString = '';
    const chosenMonthObject = this.pastMonths.find(
      (month) => month.value === this.chosenMonth,
    );
    if (chosenMonthObject && chosenMonthObject.date) {
      chosenMonthString = formatDate(
        chosenMonthObject.date,
        'yyyy-MM',
        environment.defaultLocale,
      );
    }

    let chosenPaymentString = '';
    const chosenPaymentObject = this.pastPayments.find(
      (payment) => payment.value === this.chosenPayment,
    );
    if (chosenPaymentObject && chosenPaymentObject.date) {
      chosenPaymentString = `${chosenPaymentObject.id} - ${formatDate(
        chosenPaymentObject.date,
        'yyyy-MM-dd',
        environment.defaultLocale,
      )}`;
    }

    const rows = [
      ['', this.paStates.map(({ label }) => label)],
      [
        `${rowHeader('payment')} ${chosenPaymentString}`,
        this.paStates.map(({ forPayment }) => forPayment),
      ],
      [
        rowHeader('payment-from-start'),
        this.paStates.map(({ forPaymentFromStart }) => forPaymentFromStart),
      ],
      [
        `${rowHeader('calendar-month')} ${chosenMonthString}`,
        this.paStates.map(({ forMonth }) => forMonth),
      ],
      [
        rowHeader('month-from-start'),
        this.paStates.map(({ forMonthFromStart }) => forMonthFromStart),
      ],
      [rowHeader('to-date'), this.paStates.map(({ toDate }) => toDate)],
    ];

    const csvContents = rows.map((e) => e.join(',')).join('\n');

    saveAs(
      new Blob([csvContents], { type: 'text/csv' }),
      `pa-status-metrics-${new Date().toISOString().substr(0, 10)}.csv`,
    );
  }
}
