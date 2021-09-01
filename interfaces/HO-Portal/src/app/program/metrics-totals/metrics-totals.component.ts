import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { getValueOrUnknown } from 'src/app/shared/get-value-helpers';

@Component({
  selector: 'app-metrics-totals',
  templateUrl: './metrics-totals.component.html',
  styleUrls: ['./metrics-totals.component.scss'],
})
export class MetricsTotalsComponent implements OnChanges {
  @Input()
  private program: Program;

  public lastUpdated: Date | string;

  public total: number;

  constructor(private programService: ProgramsServiceApiService) {}

  public async ngOnChanges(changes: SimpleChanges) {
    if (changes.program && typeof changes.program.currentValue === 'object') {
      this.update();
    }
  }

  public async update() {
    this.lastUpdated = getValueOrUnknown(this.program.updated);
    this.total = await this.getTotals();
  }

  private async getTotals() {
    const programMetrics = await this.programService.getMetricsById(
      this.program.id,
    );
    return programMetrics.pa.totalPaHelped;
  }
}
