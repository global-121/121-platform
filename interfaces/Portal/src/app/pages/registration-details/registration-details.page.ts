import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { RegistrationProfileComponent } from 'src/app/components/registration-profile/registration-profile.component';
import RegistrationStatus from 'src/app/enums/registration-status.enum';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { HeaderComponent } from '../../components/header/header.component';

import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { ProgramTabsNavigationComponent } from '../../program/program-tabs-navigation/program-tabs-navigation.component';
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
    RegistrationProfileComponent,
    ProgramTabsNavigationComponent,
  ],
  selector: 'app-registration-details',
  templateUrl: './registration-details.page.html',
  styleUrls: ['./registration-details.page.scss'],
})
export class RegistrationDetailsPage implements OnInit, OnDestroy {
  public programId = this.route.snapshot.params.id;
  private paId = this.route.snapshot.params.paId;

  private program: Program;
  private referenceId: string;

  public loading = true;
  public person: Person;

  public canViewPhysicalCards: boolean;
  public canViewPersonalData: boolean;
  public canViewPaymentData: boolean;

  private pubSubSubscription: Subscription;

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
        1,
        1,
        this.referenceId,
      )
    ).data[0];

    if (person.status === RegistrationStatus.deleted) {
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
  }
}
