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
        `registration."registrationProgramId"`,
        `registration."referenceId" as "referenceId"`,
        `registration."registrationStatus" as "registrationStatus"`,
        'wallet.status as "walletStatus"',
        'wallet."tokenBlocked" as "tokenBlocked"',
        'wallet."tokenCode" as "tokenCode"',
        'wallet.balance as balance',
        'wallet."lastUsedDate" as "lastUsedDate"',
      ])
      .where('registration."programId" = :programId', { programId })
      .getRawMany();
    return wallets;
  }
}
