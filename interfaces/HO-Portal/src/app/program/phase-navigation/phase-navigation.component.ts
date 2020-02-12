import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Program } from 'src/app/models/program.model';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-phase-navigation',
  templateUrl: './phase-navigation.component.html',
  styleUrls: ['./phase-navigation.component.scss'],
})
export class PhaseNavigationComponent implements OnInit {

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
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
  ) {
  }

  async ngOnInit() {
    const programId = this.route.snapshot.params.id;
    this.program = await this.programsService.getProgramById(programId);
    this.programPhases = this.createPhases();
  }


  public createPhases() {
    const phases = this.phasesInput.map((phase, index) => ({
      id: index + 1,
      phase: phase,
      label: this.translate.instant('page.programs.phases.' + phase),
      active: phase === this.program.state,
    }));
    // Set at 10 to have all sections active, for development purposes phases.
    // this.activePhaseId = 10; 
    this.activePhaseId = phases.find(item => item.active).id;
    this.activePhase = phases.find(item => item.active).phase;
    this.selectedPhaseId = this.activePhaseId;
    this.selectedPhase = this.activePhase;
    return phases
  }

  public changePhase(phase) {
    console.log(phase);
    this.selectedPhase = this.programPhases.find(item => item.id === phase).phase;
    this.selectedPhaseId = this.programPhases.find(item => item.id === phase).id;
  }

}
