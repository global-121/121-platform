import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { PaStatus } from 'src/app/models/person.model';
import { ProgramMetrics } from 'src/app/models/program-metrics.model';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { getValueOrUnknown } from 'src/app/shared/get-value-helpers';
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
    name: PaStatus;
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
        name: PaStatus.imported,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.imported'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.imported',
        ),
        toDate: this.programMetrics.pa[PaStatus.imported],
      },
      {
        name: PaStatus.invited,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.invited'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.invited',
        ),
        toDate: this.programMetrics.pa[PaStatus.invited],
      },
      {
        name: PaStatus.noLongerEligible,
        enabled: true,
        label: this.translate.instant(
          'page.program.metrics.pa.noLongerEligible',
        ),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.noLongerEligible',
        ),
        toDate: this.programMetrics.pa[PaStatus.noLongerEligible],
      },
      {
        name: PaStatus.startedRegistration,
        enabled: true,
        label: this.translate.instant(
          'page.program.metrics.pa.startedRegistration',
        ),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.startedRegistration',
        ),
        toDate: this.programMetrics.pa[PaStatus.startedRegistration],
      },
      {
        name: PaStatus.registered,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.registered'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.registered',
        ),
        toDate: this.programMetrics.pa[PaStatus.registered],
      },
      {
        name: PaStatus.selectedForValidation,
        enabled: this.program.validation,
        label: this.translate.instant(
          'page.program.metrics.pa.selectedForValidation',
        ),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.selectedForValidation',
        ),
        toDate: this.programMetrics.pa[PaStatus.selectedForValidation],
      },
      {
        name: PaStatus.validated,
        enabled: this.program.validation,
        label: this.translate.instant('page.program.metrics.pa.validated'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.validated',
        ),
        toDate: this.programMetrics.pa[PaStatus.validated],
      },
      {
        name: PaStatus.included,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.included'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.included',
        ),
        toDate: this.programMetrics.pa[PaStatus.included],
      },
      {
        name: PaStatus.inclusionEnded,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.inclusionEnded'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.inclusionEnded',
        ),
        toDate: this.programMetrics.pa[PaStatus.inclusionEnded],
      },
      {
        name: PaStatus.rejected,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.rejected'),
        explanation: this.translate.instant(
          'page.program.metrics.state-explanation.rejected',
        ),
        toDate: this.programMetrics.pa[PaStatus.rejected],
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

    const rows = [
      ['', this.paStates.map(({ label }) => label)],
      [rowHeader('payment'), this.paStates.map(({ forPayment }) => forPayment)],
      [
        rowHeader('payment-from-start'),
        this.paStates.map(({ forPaymentFromStart }) => forPaymentFromStart),
      ],
      [
        rowHeader('calendar-month'),
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
