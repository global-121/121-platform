import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ProgramPhase } from 'src/app/models/program.model';
import { ProgramPeopleAffectedComponent } from 'src/app/program/program-people-affected/program-people-affected.component';
import { ExportType } from '../../models/export-type.model';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
})
export class PaymentPage {
  public Permission = Permission;

  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.payment;
  public isReady: boolean;

  public enumExportType = ExportType;

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
