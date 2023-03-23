import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { PubSubEvent, PubSubService } from '../../services/pub-sub.service';

@Component({
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
    return (
      await this.programsService.getPeopleAffected(
        this.programId,
        this.canViewPersonalData,
        this.canViewPaymentData,
        this.referenceId,
      )
    )[0];
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
