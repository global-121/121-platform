import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { RegistrationPhysicalCardOverviewComponent } from 'src/app/components/registration-physical-card-overview/registration-physical-card-overview.component';
import { PaymentHistoryPopupComponent } from 'src/app/program/payment-history-popup/payment-history-popup.component';
import { RegistrationStatusEnum } from '../../../../../../services/121-service/src/registration/enum/registration-status.enum';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { HeaderComponent } from '../../components/header/header.component';
import { ProgramNavigationComponent } from '../../components/program-navigation/program-navigation.component';
import { RegistrationActivityOverviewComponent } from '../../components/registration-activity-overview/registration-activity-overview.component';
import { RegistrationPersonalInformationComponent } from '../../components/registration-personal-information/registration-personal-information.component';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { PubSubEvent, PubSubService } from '../../services/pub-sub.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HeaderComponent,
    TranslateModule,
    ProgramNavigationComponent,
    RegistrationActivityOverviewComponent,
    PaymentHistoryPopupComponent,
    RegistrationPersonalInformationComponent,
    RegistrationPhysicalCardOverviewComponent,
  ],
  selector: 'app-registration-details',
  templateUrl: './registration-details.page.html',
  styleUrls: ['./registration-details.page.scss'],
})
export class RegistrationDetailsPage implements OnInit, OnDestroy {
  public programId = this.route.snapshot.params.id;
  public paId = this.route.snapshot.params.paId;

  private program: Program;
  public person: Person;
  private referenceId: string;

  public loading = true;

  public canViewPersonalData: boolean;
  private canViewPaymentData: boolean;
  public canViewPhysicalCards: boolean;

  private pubSubSubscription: Subscription;

  private physicalCardFsps = ['Intersolve-visa'];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
    private pubSub: PubSubService,
  ) {
    if (!this.pubSubSubscription) {
      this.pubSubSubscription = this.pubSub.subscribe(
        PubSubEvent.dataRegistrationChanged,
        async () => {
          this.loading = true;
          this.person = await this.loadPerson();
          this.loading = false;
        },
      );
    }
  }

  async ngOnInit() {
    if (!this.programId || !this.paId) {
      this.loading = false;
      return;
    }

    this.program = await this.programsService.getProgramById(this.programId);

    try {
      this.referenceId = (
        await this.programsService.getReferenceId(this.programId, this.paId)
      ).referenceId;
    } catch (error) {
      console.log(error);
      this.loading = false;
      return;
    }
    if (!this.referenceId || !this.program) {
      this.loading = false;
      return;
    }

    this.loadPermissions();

    this.person = await this.loadPerson();

    if (!this.person) {
      this.loading = false;
      return;
    }

    this.loading = false;
  }

  ngOnDestroy(): void {
    if (this.pubSubSubscription) {
      this.pubSubSubscription.unsubscribe();
    }
  }

  private async loadPerson(): Promise<Person> {
    const person = (
      await this.programsService.getPeopleAffected(
        this.programId,
        this.canViewPersonalData,
        this.canViewPaymentData,
        // TODO: Is this fine to be 'hardcoded'?
        1,
        1,
        this.referenceId,
      )
    )[0];

    if (person.status === RegistrationStatusEnum.deleted) {
      return null;
    }

    return person;
  }

  private loadPermissions() {
    this.canViewPersonalData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationPersonalREAD],
    );

    this.canViewPaymentData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );
    this.canViewPhysicalCards = this.authService.hasAllPermissions(
      this.programId,
      [
        Permission.PaymentREAD,
        Permission.PaymentTransactionREAD,
        Permission.FspDebitCardREAD,
      ],
    );
  }

  public fspHasPhysicalCard(): boolean {
    if (!this.person || !this.person.financialServiceProvider) {
      return false;
    }

    return this.physicalCardFsps.includes(this.person.financialServiceProvider);
  }
}
