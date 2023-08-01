import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntersolveVisaWalletEntity } from '../../payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { IntersolveVisaService } from '../../payments/fsp-integration/intersolve-visa/intersolve-visa.service';

@Injectable()
export class ExportCardsService {
  @InjectRepository(IntersolveVisaWalletEntity)
  private readonly visaCardRepository: Repository<IntersolveVisaWalletEntity>;

  constructor(private readonly intersolveVisaService: IntersolveVisaService) {}

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
        'wallet.created as "issuedDate"',
        'wallet."tokenBlocked" as "tokenBlocked"',
        'wallet."tokenCode" as "tokenCode"',
        'wallet.balance as balance',
        'wallet."lastUsedDate" as "lastUsedDate"',
        `CASE WHEN wallet.id = ${this.getLatestWalletsSubquery(
          'customer',
        )} THEN true ELSE false END as "isCurrentWallet"`,
      ])
      .where('registration."programId" = :programId', { programId })
      .getRawMany();

    const mappedWallets = this.mapStatus(wallets);
    return mappedWallets;
  }

  private mapStatus(wallets: any[]): any[] {
    for (const wallet of wallets) {
      const mappedStatus =
        this.intersolveVisaService.intersolveTo121WalletStatus(
          wallet.walletStatus,
          wallet.tokenBlocked,
          wallet.isCurrentWallet,
        );
      wallet.walletStatus = mappedStatus;
      delete wallet.isCurrentWallet;
    }
    return wallets;
  }

  private getLatestWalletsSubquery(alias: string): any {
    const subQuery = this.visaCardRepository
      .createQueryBuilder('sub_wallet')
      .select('sub_wallet.id')
      .leftJoin('sub_wallet.intersolveVisaCustomer', 'sub_customer')
      .where(`sub_customer.id = ${alias}.id`)
      .orderBy('sub_wallet.created', 'DESC')
      .addOrderBy('sub_wallet.id', 'DESC')
      .limit(1)
      .getQuery();

    return `(${subQuery})`;
  }
}
