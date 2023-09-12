import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { Person } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';
import { PaymentUtils } from 'src/app/shared/payment.utils';
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
export class RegistrationProfileComponent {
  @Input()
  public person: Person;

  @Input()
  public program: Program;

  constructor(private authService: AuthService) {}

  public canViewPhysicalCards(programId: number): boolean {
    return this.authService.hasAllPermissions(programId, [
      Permission.PaymentREAD,
      Permission.PaymentTransactionREAD,
      Permission.FspDebitCardREAD,
    ]);
  }

  public fspHasPhysicalCardSupport(fspName: Person['fsp']): boolean {
    return PaymentUtils.hasPhysicalCardSupport(fspName);
  }
}
