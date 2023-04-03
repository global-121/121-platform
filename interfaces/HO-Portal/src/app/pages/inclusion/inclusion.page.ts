import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ProgramPhase } from 'src/app/models/program.model';

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

  constructor(private route: ActivatedRoute) {}

  public onReady(state: boolean) {
    this.isReady = state;
  }
}
