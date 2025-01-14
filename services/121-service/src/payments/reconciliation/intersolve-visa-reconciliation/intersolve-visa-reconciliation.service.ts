import { Injectable } from '@nestjs/common';

import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';

@Injectable()
export class IntersolveVisaReconciliationService {
  public constructor(
    private readonly intersolveVisaCustomerScopedRepository: IntersolveVisaCustomerScopedRepository,
    private readonly intersolveVisaService: IntersolveVisaService,
  ) {}

  /**
   * Retrieves and updates all wallets and cards for all customers. Used by cronjob.
   */
  public async retrieveAndUpdateAllWalletsAndCards(): Promise<void> {
    await this.intersolveVisaService.retrieveAndUpdateAllWalletsAndCards();
  }
}
