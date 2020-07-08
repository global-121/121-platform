import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ExportType } from 'src/app/models/export-type.model';
import { ProgramPhase } from 'src/app/models/program.model';

@Component({
  selector: 'app-registration-validation',
  templateUrl: './registration-validation.page.html',
  styleUrls: ['./registration-validation.page.scss'],
})
export class RegistrationValidationPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public userRole = this.authService.getUserRole();
  public thisPhase = ProgramPhase.registrationValidation;
  public isReady: boolean;

  public enumExportType = ExportType;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {}

  public onReady(state: boolean) {
    this.isReady = state;
  }
}
