import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { ProgramPhase } from 'src/app/models/program.model';

@Component({
  selector: 'app-inclusion',
  templateUrl: './inclusion.page.html',
  styleUrls: ['./inclusion.page.scss'],
})
export class InclusionPage implements OnInit {
  public Permission = Permission;

  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.inclusion;
  public isReady: boolean;

  public enumExportType = ExportType;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {}

  public onReady(state: boolean) {
    this.isReady = state;
  }
}
