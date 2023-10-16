import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ProgramPhase } from 'src/app/models/program.model';
import { ProgramPeopleAffectedComponent } from 'src/app/program/program-people-affected/program-people-affected.component';

@Component({
  selector: 'app-inclusion',
  templateUrl: './inclusion.page.html',
  styleUrls: ['./inclusion.page.scss'],
})
export class InclusionPage {
  public Permission = Permission;

  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.inclusion;
  public isReady: boolean;

  @ViewChild('table')
  public table: ProgramPeopleAffectedComponent;

  constructor(private route: ActivatedRoute) {}

  public onReady(state: boolean) {
    this.isReady = state;
  }

  public ionViewDidEnter() {
    this.table.initComponent();
  }

  public ionViewWillLeave() {
    this.table.ngOnDestroy();
  }
}
