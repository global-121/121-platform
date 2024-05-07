import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { ProgramPeopleAffectedComponent } from 'src/app/program/program-people-affected/program-people-affected.component';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-peoples-affected',
  templateUrl: './peoples-affected.page.html',
  styleUrls: ['./peoples-affected.page.scss'],
})
export class PeoplesAffectedPage implements OnInit {
  public Permission = Permission;

  public programId = this.route.snapshot.params.id;
  public program: Program;
  public thisPhase = ProgramPhase.peopleAffected;
  public isReady: boolean;

  public enumExportType = ExportType;
  public hasDuplicateAttributes: boolean;

  @ViewChild('table')
  public table: ProgramPeopleAffectedComponent;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
  ) {}

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);
    const duplicateCheckAttributes =
      await this.programsService.getDuplicateCheckAttributes(this.programId);
    this.hasDuplicateAttributes =
      !!duplicateCheckAttributes && duplicateCheckAttributes.length > 0;
  }

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
