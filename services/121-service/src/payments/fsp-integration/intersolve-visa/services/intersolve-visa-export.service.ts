import {
  ExportCardsDto,
  ExportWalletData,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/export-cards.dto';
import { IntersolveVisaStatusMappingService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-status-mapping.service';
import { Injectable } from '@nestjs/common';
import { IntersolveVisaChildWalletScopedRepository } from '../repositories/intersolve-visa-child-wallet.scoped.repository';

// TODO: REFACTOR: IMO Move into IntersolveVisaService. Make sure it does not depend on anything outside of this Module.

// TODO: Re-implement and refactor this service.
@Injectable()
export class IntersolveVisaExportService {
  constructor(
    private intersolveVisaWalletScopedRepository: IntersolveVisaChildWalletScopedRepository,
    private readonly intersolveVisaStatusMappingService: IntersolveVisaStatusMappingService,
  ) {}

  public async getCards(programId: number): Promise<ExportCardsDto[]> {
    const wallets = await this.intersolveVisaWalletScopedRepository
      .createQueryBuilder('wallet')
      .leftJoin('wallet.intersolveVisaCustomer', 'customer')
      .leftJoin('customer.registration', 'registration')
      .select([
        `registration."referenceId" as "referenceId"`,
        `registration."registrationProgramId" as "paId"`,
        `registration."registrationStatus" as "registrationStatus"`,
        'wallet."tokenCode" as "cardNumber"',
        'wallet.created as "issuedDate"',
        'wallet."lastUsedDate" as "lastUsedDate"',
        'wallet.balance as balance',
        'wallet."lastExternalUpdate" as "lastExternalUpdate"',
        'wallet."spentThisMonth" as "spentThisMonth"',
        'wallet.cardStatus as "cardStatus"',
        'wallet.walletStatus as "walletStatus"',
        'wallet."tokenBlocked" as "tokenBlocked"',
      ])
      .andWhere('registration."programId" = :programId', { programId })
      .orderBy({
        'registration."registrationProgramId"': 'ASC', // Do not change this order by as it is used to determine if something is the lasest wallet
        'wallet."created"': 'DESC',
      })
      .getRawMany();
    const mappedWallets = this.mapToDto(wallets, programId);
    return mappedWallets;
  }

  private mapToDto(
    wallets: ExportWalletData[],
    programId: number,
  ): ExportCardsDto[] {
    let previousRegistrationProgramId: number | null = null;
    const exportWalletData: ExportCardsDto[] = [];
    for (const wallet of wallets) {
      const isCurrentWallet =
        previousRegistrationProgramId === wallet.paId ? false : true;

      const statusInfo =
        this.intersolveVisaStatusMappingService.determine121StatusInfo(
          wallet.tokenBlocked ?? false,
          wallet.walletStatus,
          wallet.cardStatus,
          isCurrentWallet,
          {
            programId,
            tokenCode: wallet.cardNumber,
            referenceId: wallet.referenceId,
          },
        );

      exportWalletData.push({
        paId: wallet.paId,
        referenceId: wallet.referenceId,
        registrationStatus: wallet.registrationStatus,
        cardNumber: wallet.cardNumber,
        cardStatus121: statusInfo.walletStatus121,
        issuedDate: wallet.issuedDate,
        lastUsedDate: wallet.lastUsedDate,
        balance: wallet.balance / 100,
        explanation: statusInfo.explanation,
        spentThisMonth: wallet.spentThisMonth / 100,
        isCurrentWallet: isCurrentWallet,
      });
      previousRegistrationProgramId = wallet.paId;
    }
    return exportWalletData;
  }
}
