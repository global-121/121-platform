import { formatDate } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Program } from 'src/app/models/program.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { getValueOrUnknown } from 'src/app/shared/get-value-helpers';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-metrics-states-over-time',
  templateUrl: './metrics-states-over-time.component.html',
  styleUrls: ['./metrics-states-over-time.component.scss'],
})
export class MetricsStatesOverTimeComponent implements OnChanges {
  @Input()
  private program: Program;

  public lastUpdated: string;

  public chartData: any;

  private locale: string;

  constructor(
    private translate: TranslateService,
    private pastPaymentsService: PastPaymentsService,
  ) {
    this.locale = environment.defaultLocale;
  }

  public async ngOnChanges(changes: SimpleChanges) {
    if (changes.program && typeof changes.program.currentValue === 'object') {
      this.update();
    }
  }

  public async update() {
    this.chartData = await this.createChartData();

    this.renderUpdated();
  }

  private renderUpdated() {
    this.lastUpdated = getValueOrUnknown(this.program.updated, (value) =>
      formatDate(value, 'EEEE, dd-MM-yyyy - HH:mm', this.locale),
    );
  }

  private async createChartData() {
    const pastPayments =
      await this.pastPaymentsService.getInstallmentsWithStateSums(
        this.program.id,
      );

    const chartData = pastPayments.reverse().map((payment) => {
      return {
        name: `#${payment.id}`,
        series: [
          {
            name: this.translate.instant(
              'page.program.metrics.over-time.pa.pre-existing',
            ),
            value: payment.values['pre-existing'],
          },
          {
            name: this.translate.instant(
              'page.program.metrics.over-time.pa.new',
            ),
            value: payment.values.new,
          },
        ],
      };
    });

    return chartData;
  }
}
