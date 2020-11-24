import { Component, Input, OnInit } from '@angular/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

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

  constructor(private programsService: ProgramsServiceApiService) {}

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
}
