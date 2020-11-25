import { formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ActionType } from 'src/app/models/action-type.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

enum fspName {
  africasTalking = 'Africas-talking',
}

@Component({
  selector: 'app-test-payment',
  templateUrl: './test-payment.component.html',
  styleUrls: ['./test-payment.component.scss'],
})
export class TestPaymentComponent implements OnInit {
  @Input()
  public programId: number;
  @Input()
  public userRole: UserRole;

  public visible = false;
  public userRoleEnum = UserRole;

  private locale: string;
  public actionTimestamp;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  constructor(private programsService: ProgramsServiceApiService) {
    this.locale = environment.defaultLocale;
  }

  async ngOnInit() {
    const financialServiceProviders = (
      await this.programsService.getProgramById(this.programId)
    ).financialServiceProviders;
    if (
      financialServiceProviders
        .map((fsp) => fsp.fsp)
        .includes(fspName.africasTalking)
    ) {
      this.visible = true;
    }

    await this.getLatestActionTime();
  }

  public async doTestPayment() {
    const installment = -1;
    const amount = 0;
    await this.programsService.submitPayout(
      +this.programId,
      installment,
      amount,
    );
  }

  public async getLatestActionTime(): Promise<void> {
    const latestAction = await this.programsService.retrieveLatestActions(
      ActionType.testMpesaPayment,
      Number(this.programId),
    );
    if (latestAction) {
      this.actionTimestamp = formatDate(
        new Date(latestAction.timestamp),
        this.dateFormat,
        this.locale,
      );
    }
  }
}
