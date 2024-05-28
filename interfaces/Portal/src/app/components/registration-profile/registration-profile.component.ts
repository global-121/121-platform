import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { Event } from 'src/app/models/event.model';
import { Person } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import { EventEnum } from '../../../../../../services/121-service/src/events/enum/event.enum';
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

  @Input()
  public addHorizontalMargins = false;

  public events: Event[];

  public lastRegistrationStatusChangeEvent: Event;

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.events =
      await this.programsService.getRegistrationEventsByRegistrationId(
        this.program.id,
        this.person.id,
      );
    this.lastRegistrationStatusChangeEvent = this.events.find(
      (event) => event.type === EventEnum.registrationStatusChange,
    );
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
}
