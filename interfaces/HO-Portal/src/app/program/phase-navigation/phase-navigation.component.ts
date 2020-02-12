import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Program } from 'src/app/models/program.model';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-phase-navigation',
  templateUrl: './phase-navigation.component.html',
  styleUrls: ['./phase-navigation.component.scss'],
})
export class PhaseNavigationComponent implements OnChanges {
  @Input()
  public programPhase: string;

  @Output()
  emitSelectedPhase: EventEmitter<string> = new EventEmitter<string>();

  public program: Program;
  public programPhases: any[] = [];
  public activePhaseId: number;
  public activePhase: string;
  public selectedPhaseId: number;
  public selectedPhase: string;

  private phasesInput = [
    'design',
    'registration',
    'inclusion',
    'finalize',
    'payment',
    'evaluation'
  ];

  constructor(
    public translate: TranslateService,
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (typeof changes.programPhase.currentValue === 'string') {
      this.programPhases = this.createPhases();
    }
  }


  public createPhases() {
    const phases = this.phasesInput.map((phase, index) => ({
      id: index + 1,
      phase,
      label: this.translate.instant('page.programs.phases.' + phase),
      active: phase === this.programPhase, // this.program.state,
    }));
    this.activePhaseId = phases.find(item => item.active).id;
    this.activePhase = phases.find(item => item.active).phase;
    this.selectedPhaseId = this.activePhaseId;
    this.selectedPhase = this.activePhase;
    return phases;
  }

  public changePhase(phase) {
    this.selectedPhase = this.programPhases.find(item => item.id === phase).phase;
    this.selectedPhaseId = this.programPhases.find(item => item.id === phase).id;
    this.emitSelectedPhase.emit(this.selectedPhase);
  }

}
