import { Inject, Injectable } from '@nestjs/common';
import { ScopedRepository } from '../../../../scoped.repository';
import { getScopedRepositoryProviderName } from '../../../../utils/scope/createScopedRepositoryProvider.helper';
import { ExportCardsDto, ExportWalletData } from '../dto/export-cards.dto';
import { IntersolveVisaWalletEntity } from '../intersolve-visa-wallet.entity';
import { IntersolveVisaStatusMappingService } from './intersolve-visa-status-mapping.service';

@Injectable()
export class IntersolveVisaExportService {
  constructor(
    @Inject(getScopedRepositoryProviderName(IntersolveVisaWalletEntity))
    private intersolveVisaWalletScopedRepository: ScopedRepository<IntersolveVisaWalletEntity>,
    private readonly intersolveVisaStatusMappingService: IntersolveVisaStatusMappingService,
  ) {}

  public async getCards(programId: number): Promise<ExportCardsDto[]> {
    const wallets = await this.intersolveVisaWalletScopedRepository
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
    let previousRegistrationProgramId = null;
    const exportWalletData = [];
    for (const wallet of wallets) {
      const isCurrentWallet =
        previousRegistrationProgramId === wallet.paId ? false : true;

      const statusInfo =
        this.intersolveVisaStatusMappingService.determine121StatusInfo(
          wallet.tokenBlocked,
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
