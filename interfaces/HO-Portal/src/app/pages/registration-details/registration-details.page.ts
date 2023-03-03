import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

@Component({
  selector: 'app-registration-details',
  templateUrl: './registration-details.page.html',
  styleUrls: ['./registration-details.page.css'],
})
export class RegistrationDetailsPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public paId = this.route.snapshot.params.paId;

  public person: Person;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    if (!this.programId || !this.paId) {
      return;
    }

    const referenceId = await this.programsService.getReferenceId(
      this.programId,
      this.paId,
    );

    if (!referenceId) {
      return;
    }

    const canUpdatePersonalData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationPersonalUPDATE],
    );

    const canViewPaymentData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );

    this.person = (
      await this.programsService.getPeopleAffected(
        this.programId,
        canUpdatePersonalData,
        canViewPaymentData,
      )
    )[0];
  }
}
