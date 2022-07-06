import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-registration-validation',
  templateUrl: './registration-validation.page.html',
  styleUrls: ['./registration-validation.page.scss'],
})
export class RegistrationValidationPage implements OnInit {
  public Permission = Permission;

  public programId = this.route.snapshot.params.id;
  public program: Program;
  public thisPhase = ProgramPhase.registrationValidation;
  public isReady: boolean;

  public enumExportType = ExportType;
  public hasDuplicateAttributes: boolean;

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
}
