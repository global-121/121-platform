import { formatDate } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PaStatus } from 'src/app/models/person.model';
import { ProgramMetrics } from 'src/app/models/program-metrics.model';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { getValueOrUnknown } from 'src/app/shared/get-value-helpers';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-metrics-states',
  templateUrl: './metrics-states.component.html',
  styleUrls: ['./metrics-states.component.scss'],
})
export class MetricsStatesComponent implements OnChanges {
  @Input()
  private program: Program;

  public lastUpdated: string;

  public paStates: {
    name: PaStatus;
    enabled: boolean;
    label: string;
    explanation?: string;
    toDate: number;
    forPayment?: number;
    forMonth?: number;
  }[] = [];

  public pastPayments: {
    label: string;
    value: string;
  }[];
  public chosenPayment: any;

  public pastMonths: {
    label: string;
    value: string;
  }[];
  public chosenMonth: any;

  private programMetrics: ProgramMetrics;

  private locale: string;

  constructor(
    private translate: TranslateService,
    private programService: ProgramsServiceApiService,
  ) {
    this.locale = environment.defaultLocale;
  }

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

    this.createPastPaymentsOptions();
    this.loadDataByCondition(this.chosenPayment, 'forPayment');

    this.createPastMonthsOptions();
    this.loadDataByCondition(this.chosenMonth, 'forMonth');
  }

  private renderUpdated() {
    this.lastUpdated = getValueOrUnknown(this.programMetrics.updated, (value) =>
      formatDate(value, 'EEEE, dd-MM-yyyy - HH:mm', this.locale),
    );
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
        toDate: this.programMetrics.pa[PaStatus.invited],
      },
      {
        name: PaStatus.created,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.created'),
        toDate: this.programMetrics.pa[PaStatus.created],
      },
      {
        name: PaStatus.registered,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.registered'),
        toDate: this.programMetrics.pa[PaStatus.registered],
      },
      {
        name: PaStatus.selectedForValidation,
        enabled: this.program.validation,
        label: this.translate.instant(
          'page.program.metrics.pa.selectedForValidation',
        ),
        toDate: this.programMetrics.pa[PaStatus.selectedForValidation],
      },
      {
        name: PaStatus.validated,
        enabled: this.program.validation,
        label: this.translate.instant('page.program.metrics.pa.validated'),
        toDate: this.programMetrics.pa[PaStatus.validated],
      },
      {
        name: PaStatus.included,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.included'),
        toDate: this.programMetrics.pa[PaStatus.included],
      },
      {
        name: PaStatus.inclusionEnded,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.inclusionEnded'),
        toDate: this.programMetrics.pa[PaStatus.inclusionEnded],
      },
      {
        name: PaStatus.noLongerEligible,
        enabled: true,
        label: this.translate.instant(
          'page.program.metrics.pa.noLongerEligible',
        ),
        toDate: this.programMetrics.pa[PaStatus.noLongerEligible],
      },
      {
        name: PaStatus.rejected,
        enabled: true,
        label: this.translate.instant('page.program.metrics.pa.rejected'),
        toDate: this.programMetrics.pa[PaStatus.rejected],
      },
    ];
  }

  private createPastPaymentsOptions() {
    this.pastPayments = [
      {
        label: 'Payment #1 - 0000-00-00',
        value: 'installment=1',
      },
      {
        label: 'Payment #2 - 0000-00-00',
        value: 'installment=2',
      },
      {
        label: 'Payment #3 - 0000-00-00',
        value: 'installment=3',
      },
    ];
    this.chosenPayment = this.pastPayments[0].value;
  }

  private createPastMonthsOptions() {
    this.pastMonths = [
      {
        label: '2020-01',
        value: 'year=2020&month=0',
      },
      {
        label: '2020-02',
        value: 'year=2020&month=1',
      },
      {
        label: '2020-03',
        value: 'year=2020&month=1',
      },
    ];
    this.chosenMonth = this.pastMonths[0].value;
  }

  private async loadDataByCondition(condition: string, destination: string) {
    const timeFrameMetrics =
      await this.programService.getMetricsByIdWithCondition(
        this.program.id,
        condition,
      );

    this.paStates.map((item) => {
      item[destination] = timeFrameMetrics.pa[item.name];
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
      return;
    }
    this.loadDataByCondition(condition, destination);
  }
}
