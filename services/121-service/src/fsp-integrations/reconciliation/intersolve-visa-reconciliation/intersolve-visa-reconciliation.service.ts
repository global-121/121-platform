import { Injectable } from '@nestjs/common';

import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';

@Injectable()
export class IntersolveVisaReconciliationService {
  public constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
  ) {}

  /**
   * Retrieves and updates all wallets and cards for all customers. Used by cronjob.
   */
  public async retrieveAndUpdateAllWalletsAndCards(): Promise<number> {
    return await this.intersolveVisaService.retrieveAndUpdateAllWalletsAndCards();
  }
}
