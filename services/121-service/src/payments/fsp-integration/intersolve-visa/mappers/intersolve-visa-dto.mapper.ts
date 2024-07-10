import { IntersolveVisaCard } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-card';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.const';
import { IntersolveVisaStatusMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-status.mapper';

export class IntersolveVisaDtoMapper {
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
  ): IntersolveVisaCard {
    const statusInfo =
      IntersolveVisaStatusMapper.determineVisaCard121StatusInformation({
        tokenBlocked: childWallet.isTokenBlocked,
        walletStatus: childWallet.walletStatus,
        cardStatus: childWallet.cardStatus,
      });
    const cardDto: IntersolveVisaCard = {
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
