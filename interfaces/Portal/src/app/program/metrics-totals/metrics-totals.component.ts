import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { getValueOrUnknown } from 'src/app/shared/get-value-helpers';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-metrics-totals',
  templateUrl: './metrics-totals.component.html',
  styleUrls: ['./metrics-totals.component.scss'],
})
export class MetricsTotalsComponent implements OnChanges {
  public locale: string;

  @Input()
  private program: Program;

  public lastUpdated: Date | string;

  public total: number;

  constructor(
    private programService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

  public async ngOnChanges(changes: SimpleChanges) {
    if (changes.program && typeof changes.program.currentValue === 'object') {
      this.update();
    }
  }

  public async update() {
    const programMetrics = await this.programService.getMetricsById(
      this.program.id,
    );
    this.lastUpdated = getValueOrUnknown(programMetrics.updated);
    this.total = programMetrics.pa.totalPaHelped;
  }
}
