import { Component, Input, OnInit } from '@angular/core';
import {
  ProgramPhaseService,
  Phase,
} from 'src/app/services/program-phase.service';

@Component({
  selector: 'app-phase-navigation',
  templateUrl: './phase-navigation.component.html',
  styleUrls: ['./phase-navigation.component.scss'],
})
export class PhaseNavigationComponent implements OnInit {
  @Input()
  public programId: number;

  public programPhases: Phase[];
  private activePhase: Phase;

  constructor(private programPhaseService: ProgramPhaseService) {}

  async ngOnInit() {
    this.programPhases = await this.programPhaseService.getPhases(
      this.programId,
    );
    this.activePhase = this.programPhaseService.getActivePhase();
  }

  public isDisabled(phase: Phase): boolean {
    return phase.id > this.activePhase.id;
  }

  public getFill(phase: Phase): string {
    let fill = 'outline';

    if (phase.active) {
      fill = 'solid';
    }

    if (this.isDisabled(phase)) {
      fill = 'clear';
    }

    return fill;
  }
}
