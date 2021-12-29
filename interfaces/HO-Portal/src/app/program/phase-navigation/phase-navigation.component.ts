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
}
