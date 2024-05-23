import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ProgramTab } from 'src/app/models/program.model';

@Component({
  selector: 'app-program-overview',
  templateUrl: './program-overview.page.html',
  styleUrls: ['./program-overview.page.scss'],
})
export class ProgramOverviewPage {
  public Permission = Permission;

  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramTab.overview;

  constructor(private route: ActivatedRoute) {}
}
