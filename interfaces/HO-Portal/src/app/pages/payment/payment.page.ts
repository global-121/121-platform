import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ExportType } from 'src/app/models/export-type.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public program: Program;
  public thisPhase = ProgramPhase.payment;
  public isReady: boolean;

  public userRole = this.authService.getUserRole();

  public enumExportType = ExportType;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
  ) {}

  ngOnInit() {}

  async isIntersolve() {
    this.program = await this.programsService.getProgramById(this.programId);
    for (const fsp of this.program.financialServiceProviders) {
      if (fsp.fsp.toLowerCase().includes('intersolve')) {
        return true;
      }
    }
    return false;
  }

  public onReady(state: boolean) {
    this.isReady = state;
  }
}
