import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-phase-navigation',
  templateUrl: './phase-navigation.component.html',
  styleUrls: ['./phase-navigation.component.scss'],
})
export class PhaseNavigationComponent implements OnChanges {
  @Input()
  public activePhase: string;
  @Input()
  public programPhases: any[];
  @Output()
  outputSelectedPhase: EventEmitter<string> = new EventEmitter<string>();

  public program: Program;
  public activePhaseId: number;
  public selectedPhaseId: number;
  public selectedPhase: string;

  constructor() {
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (typeof changes.programPhases.currentValue === 'object') {
      this.update();
    }
  }

  private update() {
    const activePhase = this.programPhases.find(item => item.active);
    this.activePhaseId = activePhase.id;
    this.selectedPhaseId = this.activePhaseId;
    this.activePhase = activePhase.phase;
    this.selectedPhase = this.activePhase;
  }

  public changePhase(phase) {
    const selectedPhaseObj = this.programPhases.find(item => item.id === phase);
    this.selectedPhase = selectedPhaseObj.phase;
    this.selectedPhaseId = selectedPhaseObj.id;
    this.outputSelectedPhase.emit(this.selectedPhase);
  }

  public getColor(phase) {
    let color = 'medium';

    if (phase.id === this.selectedPhaseId) {
      color = 'primary';
    }

    return color;
  }

  public getFill(phase) {
    let fill = 'outline';

    if (phase.active) {
      fill = 'solid';
    }

    if (phase.id > this.activePhaseId) {
      fill = 'clear';
    }

    return fill;
  }

}
