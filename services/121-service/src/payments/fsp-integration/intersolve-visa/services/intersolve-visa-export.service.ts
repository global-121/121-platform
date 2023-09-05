import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportCardsDto, ExportWalletData } from '../dto/export-cards.dto';
import { IntersolveVisaWalletEntity } from '../intersolve-visa-wallet.entity';
import { IntersolveVisaStatusMappingService } from './intersolve-visa-status-mapping.service';

@Injectable()
export class IntersolveVisaExportService {
  @InjectRepository(IntersolveVisaWalletEntity)
  private readonly visaCardRepository: Repository<IntersolveVisaWalletEntity>;

  constructor(
    private readonly intersolveVisaStatusMappingService: IntersolveVisaStatusMappingService,
  ) {}

  public async getCards(programId: number): Promise<ExportCardsDto[]> {
    const wallets = await this.visaCardRepository
      .createQueryBuilder('wallet')
      .leftJoin('wallet.intersolveVisaCustomer', 'customer')
      .leftJoin('customer.registration', 'registration')
      .select([
        `registration."registrationProgramId" as "paId"`,
        `registration."referenceId" as "referenceId"`,
        `registration."registrationStatus" as "registrationStatus"`,
        'wallet."tokenCode" as "cardNumber"',
        'wallet.created as "issuedDate"',
        'wallet."lastUsedDate" as "lastUsedDate"',
        'wallet.balance as balance',
        'wallet."lastExternalUpdate" as "lastExternalUpdate"',
        'wallet.cardStatus as "cardStatus"',
        'wallet.walletStatus as "walletStatus"',
        'wallet."tokenBlocked" as "tokenBlocked"',
        `CASE WHEN wallet.id = ${this.getLatestWalletsSubquery(
          'customer',
        )} THEN true ELSE false END as "isCurrentWallet"`,
      ])
      .where('registration."programId" = :programId', { programId })
      .getRawMany();

    const mappedWallets = this.mapToDto(wallets);
    return mappedWallets;
  }

  private mapToDto(wallets: ExportWalletData[]): ExportCardsDto[] {
    return wallets.map((wallet) => ({
      paId: wallet.paId,
      referenceId: wallet.referenceId,
      registrationStatus: wallet.registrationStatus,
      cardNumber: wallet.cardNumber,
      cardStatus121: this.intersolveVisaStatusMappingService.determine121Status(
        wallet.tokenBlocked,
        wallet.walletStatus,
        wallet.cardStatus,
        wallet.isCurrentWallet,
      ),
      issuedDate: wallet.issuedDate,
      lastUsedDate: wallet.lastUsedDate,
      balance: wallet.balance,
    }));
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
