import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-evaluation',
  templateUrl: './evaluation.page.html',
  styleUrls: ['./evaluation.page.scss'],
})
export class EvaluationPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  private program: Program;

  public evaluationDashboardUrl: string;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
  ) {}

  public async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);

    if (this.program && this.program.evaluationDashboardUrl) {
      this.evaluationDashboardUrl = this.program.evaluationDashboardUrl;
    }
  }
}
