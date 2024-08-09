import { IntersolveVisaCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-card.dto';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.const';
import { IntersolveVisaStatusMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-status.mapper';

export class IntersolveVisaDtoMapper {
  /**
   * This function maps a parent wallet entity to a wallet DTO.
   * - It first sorts the child wallets associated with the parent wallet by their creation time, with the newest wallet first.
   * - It then maps each child wallet to a card DTO. The wallet status, card status, and token blocked status are used to determine the card's status, explanation, and actions.
   * - Finally, it creates a new wallet DTO with the sorted cards and the parent wallet's information.
   *
   * @param {IntersolveVisaParentWalletEntity} intersolveVisaParentWalletEntity - The parent wallet entity to map.
   * @returns {IntersolveVisaWalletDto} The mapped wallet DTO.
   */
  public static mapParentWalletEntityToWalletDto(
    intersolveVisaParentWalletEntity: IntersolveVisaParentWalletEntity,
  ): IntersolveVisaWalletDto {
    // Sort wallets by newest first, newest = current wallet
    const sortedWallets =
      intersolveVisaParentWalletEntity.intersolveVisaChildWallets.sort(
        (a, b) => b.created.getTime() - a.created.getTime(),
      );

    const cards = sortedWallets.map((wallet) =>
      this.mapChildWalletEntityToCard(wallet),
    );

    const dto: IntersolveVisaWalletDto = {
      tokenCode: intersolveVisaParentWalletEntity.tokenCode,
      balance: intersolveVisaParentWalletEntity.balance,
      spentThisMonth: intersolveVisaParentWalletEntity.spentThisMonth,
      maxToSpendPerMonth: maximumAmountOfSpentCentPerMonth,
      lastUsedDate: intersolveVisaParentWalletEntity.lastUsedDate,
      lastExternalUpdate:
        intersolveVisaParentWalletEntity.lastExternalUpdate.toISOString(),
      cards: cards,
    };
    return dto;
  }

  private static mapChildWalletEntityToCard(
    childWallet: IntersolveVisaChildWalletEntity,
  ): IntersolveVisaCardDto {
    const statusInfo =
      IntersolveVisaStatusMapper.determineVisaCard121StatusInformation({
        isTokenBlocked: childWallet.isTokenBlocked,
        walletStatus: childWallet.walletStatus,
        cardStatus: childWallet.cardStatus,
      });
    const cardDto: IntersolveVisaCardDto = {
      tokenCode: childWallet.tokenCode,
      status: statusInfo.status,
      explanation: statusInfo.explanation,
      issuedDate: childWallet.created,
      actions: statusInfo.actions,
      debugInformation: {
        intersolveVisaCardStatus: childWallet.cardStatus,
        intersolveVisaTokenStatus: childWallet.walletStatus,
        isTokenBlocked: childWallet.isTokenBlocked,
      },
    };
    return cardDto;
  }
}
