import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletStatus121 } from '../../payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import {
  IntersolveVisaWalletEntity,
  IntersolveVisaWalletStatus,
} from '../../payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { IntersolveVisaService } from '../../payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';

class ExportCardsDto {
  PAid: number;
  referenceId: string;
  registrationStatus: RegistrationStatusEnum;
  cardNumber: number;
  cardStatus121: WalletStatus121;
  issuedDate: Date;
  lastUsedDate: Date;
  balance: number;
  cardStatusIntersolve?: IntersolveVisaWalletStatus;
  tokenBlocked?: boolean;
  isCurrentWallet?: boolean;
}
@Injectable()
export class ExportCardsService {
  @InjectRepository(IntersolveVisaWalletEntity)
  private readonly visaCardRepository: Repository<IntersolveVisaWalletEntity>;

  constructor(private readonly intersolveVisaService: IntersolveVisaService) {}

  public async getCards(programId: number): Promise<ExportCardsDto[]> {
    const wallets = await this.visaCardRepository
      .createQueryBuilder('wallet')
      .leftJoin('wallet.intersolveVisaCustomer', 'customer')
      .leftJoin('customer.registration', 'registration')
      .select([
        `registration."registrationProgramId" as "PAid"`,
        `registration."referenceId" as "referenceId"`,
        `registration."registrationStatus" as "registrationStatus"`,
        'wallet."tokenCode" as "cardNumber"',
        'wallet.created as "issuedDate"',
        'wallet."lastUsedDate" as "lastUsedDate"',
        'wallet.balance as balance',
        'wallet.status as "cardStatusIntersolve"',
        'wallet."tokenBlocked" as "tokenBlocked"',
        `CASE WHEN wallet.id = ${this.getLatestWalletsSubquery(
          'customer',
        )} THEN true ELSE false END as "isCurrentWallet"`,
      ])
      .where('registration."programId" = :programId', { programId })
      .getRawMany();

    const mappedWallets = this.mapStatus(wallets);
    return mappedWallets;
  }

  private mapStatus(wallets: ExportCardsDto[]): ExportCardsDto[] {
    for (const wallet of wallets) {
      const mappedStatus =
        this.intersolveVisaService.intersolveTo121WalletStatus(
          wallet.cardStatusIntersolve,
          wallet.tokenBlocked,
          wallet.isCurrentWallet,
        );
      wallet.cardStatus121 = mappedStatus;
      delete wallet.cardStatusIntersolve;
      delete wallet.tokenBlocked;
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
