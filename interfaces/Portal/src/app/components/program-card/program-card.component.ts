import { Component, Input, OnInit } from '@angular/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { Program, ProgramStats } from 'src/app/models/program.model';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';

@Component({
  selector: 'app-program-card',
  templateUrl: './program-card.component.html',
  styleUrls: ['./program-card.component.scss'],
})
export class ProgramCardComponent implements OnInit {
  @Input()
  program: Program;

  @Input()
  programStats: ProgramStats;

  public DateFormat = DateFormat;
  public progress = 0;
  public phase: Phase;

  private programPhases: Phase[];

  constructor(private programPhaseService: ProgramPhaseService) {}

  async ngOnInit() {
    if (!this.program) {
      return;
    }

    this.programPhases = await this.programPhaseService.getPhases(
      this.program.id,
    );

    this.phase = this.programPhases.find((p) => p.name === this.program.phase);
    this.progress = this.phase.id / this.programPhases.length;
  }
}
