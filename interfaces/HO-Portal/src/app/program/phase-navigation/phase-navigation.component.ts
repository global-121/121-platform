import { Component, Input, OnInit } from '@angular/core';
import {
  Phase,
  ProgramPhaseService,
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

  constructor(private programPhaseService: ProgramPhaseService) {}

  async ngOnInit() {
    this.programPhases = await this.programPhaseService.getPhases(
      this.programId,
    );
  }

  // public getFill(phase: Phase): string {
  //   let fill = 'outline';

  //   if (phase.active) {
  //     fill = 'solid';
  //   }

  //   if (phase.disabled) {
  //     fill = 'clear';
  //   }

  //   return fill;
  // }
}
