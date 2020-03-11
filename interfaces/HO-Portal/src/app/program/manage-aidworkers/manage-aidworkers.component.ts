import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ProgramPhase } from 'src/app/models/program.model';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-manage-aidworkers',
  templateUrl: './manage-aidworkers.component.html',
  styleUrls: ['./manage-aidworkers.component.scss'],
})
export class ManageAidworkersComponent implements OnChanges {
  @Input()
  public selectedPhase: string;
  @Input()
  public aidworkers: any[];

  public componentVisible: boolean;
  private presentInPhases = [
    ProgramPhase.design,
    ProgramPhase.registration,
    ProgramPhase.inclusion,
    ProgramPhase.finalize,
    ProgramPhase.payment,
    ProgramPhase.evaluation,
  ];

  public columns = [
    {
      prop: 'email',
      name: this.translate.instant('page.program.manage-aidworkers.column-email'),
      draggable: false,
      resizeable: false
    },
    {
      prop: 'created',
      name: this.translate.instant('page.program.manage-aidworkers.column-created'),
      draggable: false,
      resizeable: false
    }
  ];

  public tableMessages: any;
  private locale: string;
  private dateFormat = 'yyyy-MM-dd, hh:mm';

  constructor(
    public translate: TranslateService
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  ngOnInit() { }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedPhase && typeof changes.selectedPhase.currentValue === 'string') {
      this.checkVisibility(this.selectedPhase);
    }
    if (changes.aidworkers && typeof changes.aidworkers.currentValue === 'object' && changes.aidworkers.currentValue) {
      this.loadData();
    }
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase);
  }

  public loadData() {
    this.aidworkers.forEach((aidworker) => {
      aidworker.email = aidworker.email;
      aidworker.created = formatDate(aidworker.created, this.dateFormat, this.locale);
    });
  }

}
