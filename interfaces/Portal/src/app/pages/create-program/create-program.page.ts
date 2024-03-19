import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-create-program',
  templateUrl: './create-program.page.html',
  styleUrls: ['./create-program.page.scss'],
})
export class CreateProgramPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public program: Program;
  public canViewMetrics: boolean;

  public koboTokenValue = '';

  public koboAssetIdValue = '';

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);

    this.canViewMetrics = this.authService.hasPermission(
      this.programId,
      Permission.ProgramMetricsREAD,
    );
  }

  public async createProgram() {
    console.log(
      '🚀 ~ CreateProgramPage ~ koboTokenValue:',
      this.koboTokenValue,
    );
    console.log(
      '🚀 ~ CreateProgramPage ~ koboAssetIdValue:',
      this.koboAssetIdValue,
    );
  }

  public disableCreateProgramButton(): boolean {
    if (
      !this.koboTokenValue ||
      !this.koboAssetIdValue ||
      this.koboTokenValue === '' ||
      this.koboAssetIdValue === ''
    ) {
      return true;
    }

    return false;
  }
}
