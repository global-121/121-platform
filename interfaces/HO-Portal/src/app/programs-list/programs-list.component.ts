import { Component, OnInit } from '@angular/core';
import { Program, ProgramStats } from '../models/program.model';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { TranslatableStringService } from '../services/translatable-string.service';

@Component({
  selector: 'app-programs-list',
  templateUrl: './programs-list.component.html',
  styleUrls: ['./programs-list.component.scss'],
})
export class ProgramsListComponent implements OnInit {
  public loading: boolean;
  public items: Program[];
  private programStats: ProgramStats[];

  constructor(
    private programsService: ProgramsServiceApiService,
    private translatableString: TranslatableStringService,
  ) {}

  public ngOnInit(): void {
    // Skip refreshing if already loading
    if (!this.loading) {
      this.refresh();
    }
  }

  private async refresh() {
    this.loading = true;
    const programs = await this.programsService.getAllPrograms();
    this.programStats = await this.programsService.getAllProgramsStats(
      programs.map((p) => p.id),
    );
    this.items = this.translateProperties(programs).sort((a, b) =>
      a.created <= b.created ? -1 : 1,
    );
    this.loading = false;
  }

  private translateProperties(programs: Program[]): Program[] {
    return programs.map((program: Program) => {
      program.titlePortal = this.translatableString.get(program.titlePortal);
      program.description = this.translatableString.get(program.description);

      return program;
    });
  }

  public getProgramStatsById(programId: number): ProgramStats {
    return this.programStats.find((p) => p.programId === programId);
  }
}
