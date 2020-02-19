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
  @Input()
  public programPhases: any[];
  @Output()
  emitSelectedPhase: EventEmitter<string> = new EventEmitter<string>();

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
    this.activePhaseId = this.programPhases.find(item => item.active).id;
    this.selectedPhaseId = this.activePhaseId;
    this.activePhase = this.programPhases.find(item => item.active).phase;
    this.selectedPhase = this.activePhase;
  }

  public changePhase(phase) {
    this.selectedPhase = this.programPhases.find(item => item.id === phase).phase;
    this.selectedPhaseId = this.programPhases.find(item => item.id === phase).id;
    this.emitSelectedPhase.emit(this.selectedPhase);
  }

}
