import { Component, OnInit } from '@angular/core';
import { Program } from 'src/app/models/program.model';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public program: Program;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
  ) {}

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);
  }
}
