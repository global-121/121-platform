import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { Person } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import { RegistrationStatusChange } from '../../models/registration-status-change.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { RegistrationActivityOverviewComponent } from '../registration-activity-overview/registration-activity-overview.component';
import { RegistrationPersonalInformationComponent } from '../registration-personal-information/registration-personal-information.component';
import { RegistrationPhysicalCardOverviewComponent } from '../registration-physical-card-overview/registration-physical-card-overview.component';

@Component({
  selector: 'app-registration-profile',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RegistrationPersonalInformationComponent,
    RegistrationPhysicalCardOverviewComponent,
    RegistrationActivityOverviewComponent,
  ],
  templateUrl: './registration-profile.component.html',
  styleUrls: ['./registration-profile.component.css'],
})
export class RegistrationProfileComponent implements OnInit {
  @Input()
  public person: Person;

  @Input()
  public program: Program;

  public statusChanges: RegistrationStatusChange[];

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.statusChanges = await this.getStatusChanges();
  }

  public canViewPhysicalCards(programId: number): boolean {
    return this.authService.hasAllPermissions(programId, [
      Permission.PaymentREAD,
      Permission.PaymentTransactionREAD,
      Permission.FspDebitCardREAD,
    ]);
  }

  public fspHasPhysicalCardSupport(
    fspName: Person['financialServiceProvider'],
  ): boolean {
    return PaymentUtils.hasPhysicalCardSupport(fspName);
  }

  private async getStatusChanges(): Promise<RegistrationStatusChange[]> {
    const changes = await this.programsService.getRegistrationStatusChanges(
      this.program.id,
      this.person.referenceId,
    );

    changes.sort((a, b) => {
      if (a.date < b.date) {
        return 1;
      }

      return -1;
    });

    return changes;
  }
}
