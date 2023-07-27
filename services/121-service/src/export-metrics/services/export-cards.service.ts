import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntersolveVisaWalletEntity } from '../../payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';

@Injectable()
export class ExportCardsService {
  @InjectRepository(IntersolveVisaWalletEntity)
  private readonly visaCardRepository: Repository<IntersolveVisaWalletEntity>;

  public async getCards(programId: number): Promise<any> {
    const wallets = await this.visaCardRepository
      .createQueryBuilder('wallet')
      .leftJoin('wallet.intersolveVisaCustomer', 'customer')
      .leftJoin('customer.registration', 'registration')
      .select([
        `registration."referenceId" as "referenceId"`,
        `registration."registrationProgramId"`,
        `registration."registrationStatus" as registrationStatus`,
        'wallet.status as walletStatus',
        'wallet."tokenBlocked" as tokenBlocked',
        'wallet."lastExternalUpdate" as lastExternalUpdate',
        'wallet."lastUsedDate" as lastUsedDate',
        'wallet.balance as balance',
        'wallet."debitCardCreated" as debitCardCreated',
      ])
      .where('registration."programId" = :programId', { programId })
      .getMany();
    return wallets;
  }
}
