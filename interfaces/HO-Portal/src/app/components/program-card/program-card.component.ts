import { Component, Input, OnInit } from '@angular/core';
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

  public progress: number = 0;
  private programPhases: Phase[];

  constructor(private programPhaseService: ProgramPhaseService) {}

  async ngOnInit() {
    if (!this.program) {
      return;
    }

    this.programPhases = await this.programPhaseService.getPhases(
      this.program.id,
    );

    this.progress =
      this.programPhases.find((p) => p.name === this.program.phase).id /
      this.programPhases.length;
  }
}
