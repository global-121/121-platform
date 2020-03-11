import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ProgramPhase } from 'src/app/models/program.model';
import { formatDate } from '@angular/common';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { UserRole } from 'src/app/auth/user-role.enum';

@Component({
  selector: 'app-manage-aidworkers',
  templateUrl: './manage-aidworkers.component.html',
  styleUrls: ['./manage-aidworkers.component.scss'],
})
export class ManageAidworkersComponent implements OnChanges {
  @Input()
  public selectedPhase: string;
  @Input()
  public programId: number;
  @Input()
  public userRole: string;

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
    },
    {
      prop: 'delete',
      name: this.translate.instant('page.program.manage-aidworkers.column-delete'),
      draggable: false,
      resizeable: false,
      sortable: false
    }
  ];
  public aidworkers: any[];

  public tableMessages: any;
  private locale: string;
  private dateFormat = 'yyyy-MM-dd, hh:mm';

  constructor(
    public translate: TranslateService,
    public programsSerivce: ProgramsServiceApiService
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  ngOnInit() { }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedPhase && typeof changes.selectedPhase.currentValue === 'string') {
      this.checkVisibility(this.selectedPhase);
    }
    if (changes.programId && typeof changes.programId.currentValue === 'number') {
      this.loadData();
    }
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase) && this.userRole !== UserRole.PrivacyOfficer;
  }

  public async loadData() {
    const program = await this.programsSerivce.getProgramById(this.programId);
    this.aidworkers = program.aidworkers;

    this.aidworkers.forEach((aidworker) => {
      aidworker.email = aidworker.email;
      aidworker.created = formatDate(aidworker.created, this.dateFormat, this.locale);
    });
  }

  public async deleteAidworker(row) {
    await this.programsSerivce.deleteUser(row.id);
    this.loadData();
  }

}
