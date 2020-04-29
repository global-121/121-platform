import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { ProgramPhase } from 'src/app/models/program.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-program-people-affected',
  templateUrl: './program-people-affected.component.html',
  styleUrls: ['./program-people-affected.component.scss'],
})
export class ProgramPeopleAffectedComponent implements OnChanges {
  @Input()
  public selectedPhase: string;

  public componentVisible: boolean;
  private presentInPhases = [
    ProgramPhase.design,
    ProgramPhase.registration,
    ProgramPhase.inclusion,
    ProgramPhase.finalize,
    ProgramPhase.payment,
    ProgramPhase.evaluation
  ];
  private locale: string;
  private dateFormat = 'yyyy-MM-dd, hh:mm';

  constructor(
    public translate: TranslateService
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  async ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
    if (changes.selectedPhase && typeof changes.selectedPhase.currentValue === 'string') {
      this.checkVisibility(this.selectedPhase);
    }
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase);
  }

}
