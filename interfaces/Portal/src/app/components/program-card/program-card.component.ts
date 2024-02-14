import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { Program, ProgramStats } from 'src/app/models/program.model';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-program-card',
  templateUrl: './program-card.component.html',
  styleUrls: ['./program-card.component.scss'],
})
export class ProgramCardComponent implements OnInit {
  public locale: string;

  @Input()
  program: Program;

  @Input()
  programStats: ProgramStats;

  public DateFormat = DateFormat;
  public phase: Phase;

  private programPhases: Phase[];

  constructor(
    private programPhaseService: ProgramPhaseService,
    private translate: TranslateService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

  async ngOnInit() {
    if (!this.program) {
      return;
    }

    this.programPhases = await this.programPhaseService.getPhases(
      this.program.id,
    );

    this.phase = this.programPhases.find((p) => p.name === this.program.phase);
  }
}
