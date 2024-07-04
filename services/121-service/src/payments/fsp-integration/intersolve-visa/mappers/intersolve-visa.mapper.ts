import { IntersolveVisaDebitCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-debit-card.dto';
import { IntersolveVisaParentWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-parent-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.const';
import { IntersolveVisaStatusMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-status.mapper';

interface MapChildWalletInputParams {
  wallet: IntersolveVisaChildWalletEntity;
  isCurrentWallet: boolean;
  referenceId: string;
  programId: number;
}

export class IntersolveVisaMapper {
  public static parentWalletEntityToDto(
    intersolveVisaParentWalletEntity: IntersolveVisaParentWalletEntity,
    programId: number,
    referenceId: string,
  ): IntersolveVisaParentWalletDto {
    // Determine the newest/ curent wallet
    const sortedWallets =
      intersolveVisaParentWalletEntity.intersolveVisaChildWallets.sort(
        (a, b) => b.created.getTime() - a.created.getTime(),
      );

    const cards = sortedWallets.map((wallet, index) =>
      this.mapChildWalletEntityToCardDto({
        wallet,
        isCurrentWallet: index === 0, // The first wallet is the current wallet since they are ordered by newest
        referenceId,
        programId,
      }),
    );

    const dto: IntersolveVisaParentWalletDto = {
      balance: intersolveVisaParentWalletEntity.balance,
      lastExternalUpdate:
        intersolveVisaParentWalletEntity.lastExternalUpdate.toISOString(),
      spentThisMonth: intersolveVisaParentWalletEntity.spentThisMonth,
      lastUsedDate: intersolveVisaParentWalletEntity.lastUsedDate,
      cards: cards,
      maxToSpendPerMonth: maximumAmountOfSpentCentPerMonth,
    };
    return dto;
  }

  private static mapChildWalletEntityToCardDto(
    param: MapChildWalletInputParams,
  ): IntersolveVisaDebitCardDto {
    const wallet = param.wallet;
    const statusInfo = IntersolveVisaStatusMapper.map121StatusInfo({
      tokenBlocked: wallet.isTokenBlocked,
      walletStatus: wallet.walletStatus,
      cardStatus: wallet.cardStatus,
      linkCreationInfo: {
        referenceId: param.referenceId,
        programId: param.programId,
        tokenCode: wallet.tokenCode,
      },
    });
    const cardDto: IntersolveVisaDebitCardDto = {
      tokenCode: wallet.tokenCode,
      status: statusInfo.walletStatus121,
      links: statusInfo.links,
      issuedDate: wallet.created,
      debugInfo: {
        intersolveVisaCardStatus: wallet.cardStatus,
        intersolveVisaWalletStatus: wallet.walletStatus,
      },
      explanation: statusInfo.explanation,
    };
    return cardDto;
  }
}
