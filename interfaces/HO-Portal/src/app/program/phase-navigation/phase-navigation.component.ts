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
  public activePhase: string;
  @Output()
  emitSelectedPhase: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  emitProgramPhases: EventEmitter<any[]> = new EventEmitter<any[]>();

  public program: Program;
  public programPhases: any[] = [];
  public activePhaseId: number;
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

  async ngOnChanges(changes: SimpleChanges) {
    if (typeof changes.activePhase.currentValue === 'string') {
      this.programPhases = await this.createPhases();
      this.emitProgramPhases.emit(this.programPhases);
    }
  }


  public createPhases() {
    const phases = this.phasesInput.map((phase, index) => ({
      id: index + 1,
      phase,
      label: this.translate.instant('page.programs.phases.' + phase + '.label'),
      active: phase === this.activePhase,
      btnText: this.translate.instant('page.programs.phases.' + phase + '.btnText'),
    }));
    this.activePhaseId = phases.find(item => item.active).id;
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
