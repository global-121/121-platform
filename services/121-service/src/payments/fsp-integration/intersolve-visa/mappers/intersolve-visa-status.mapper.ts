import { EXTERNAL_API } from '@121-service/src/config';
import { VisaCardActionLinkDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-action-link.dto';
import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-action.enum';
import { VisaCardMethod } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-method.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import csvParser from 'csv-parser';
import fs from 'fs';
import * as path from 'path';

const StatusUnknownExplain = `Status is unknown, please contact the 121 Platform Team`;

interface VisaStatusMapInterface {
  TokenBlocked: boolean;
  WalletStatus: string;
  CardStatus: string;
  IsCurrentWallet: boolean;
  '121Status': string;
  Explanation: string;
  Actions: string;
}

interface VisaStatusInfoDto {
  walletStatus121: WalletCardStatus121;
  explanation: string;
  links: VisaCardActionLinkDto[];
}

interface DetermineVisaStatusInfoParams {
  tokenBlocked: boolean;
  walletStatus: IntersolveVisaTokenStatus | null;
  cardStatus: IntersolveVisaCardStatus | null;
  isCurrentWallet: boolean;
  linkCreationInfo: VisaCardLinkCreationInfo;
}

interface VisaCardLinkCreationInfo {
  referenceId: string;
  programId: number;
  tokenCode: string;
}

const VisaCardActionsMapping = {
  Pause: VisaCardAction.pause,
  Unpause: VisaCardAction.unpause,
  'Issue New Card': VisaCardAction.reissue,
};

export class IntersolveVisaStatusMapper {
  private static mapping: VisaStatusMapInterface[] = [];

  constructor() {
    this.loadMapping();
  }

  private loadMapping(): void {
    const csvFilePath = path.join(__dirname, 'visaStatusMap.csv');
    fs.createReadStream(csvFilePath)
      .pipe(csvParser({ separator: ';' }))
      .on('data', (row) => {
        const mappingRow: VisaStatusMapInterface = {
          TokenBlocked: row.TokenBlocked ? row.TokenBlocked === 'TRUE' : false,
          WalletStatus: row.WalletStatus ? row.WalletStatus.trim() : '',
          CardStatus: row.CardStatus ? row.CardStatus.trim() : '',
          IsCurrentWallet: row.IsCurrentWallet
            ? row.IsCurrentWallet.trim() === 'TRUE'
            : false,
          '121Status': row['121Status']
            ? row['121Status'].trim()
            : WalletCardStatus121.Unknown,
          Explanation: row.Explanation ? row.Explanation.trim() : '',
          Actions: row.Actions ? row.Actions.trim() : null,
        };
        IntersolveVisaStatusMapper.mapping.push(mappingRow);
      });
  }

  public static determine121StatusInfo(
    params: DetermineVisaStatusInfoParams,
  ): VisaStatusInfoDto {
    const matchingRow = IntersolveVisaStatusMapper.mapping.find(
      (row) =>
        row.TokenBlocked === params.tokenBlocked &&
        row.WalletStatus === params.walletStatus &&
        row.CardStatus === params.cardStatus &&
        row.IsCurrentWallet === params.isCurrentWallet,
    );
    if (matchingRow) {
      return {
        walletStatus121: matchingRow['121Status'] as WalletCardStatus121,
        explanation: matchingRow['Explanation'],
        links: this.getLinks(matchingRow['Actions'], params.linkCreationInfo),
      };
    } else {
      return {
        walletStatus121: WalletCardStatus121.Unknown,
        explanation: StatusUnknownExplain,
        links: [],
      };
    }
  }

  private static getLinks(
    actions: string,
    linkCreationInfo: VisaCardLinkCreationInfo,
  ): VisaCardActionLinkDto[] {
    if (!actions) {
      return [];
    }

    const links: VisaCardActionLinkDto[] = [];
    const actionsArray = actions.split(',');

    for (const rawAction of actionsArray) {
      const action = rawAction.trim();

      if (VisaCardActionsMapping[action]) {
        const link = {
          href: this.buildHref(
            VisaCardActionsMapping[action],
            linkCreationInfo,
          ),
          action: VisaCardActionsMapping[action],
          method:
            VisaCardAction.reissue === VisaCardActionsMapping[action]
              ? VisaCardMethod.POST
              : VisaCardMethod.PATCH,
        };
        links.push(link);
      }
    }
    return links;
  }

  private static buildHref(
    action: VisaCardAction,
    linkCreationInfo: VisaCardLinkCreationInfo,
  ): string {
    switch (action) {
      case VisaCardAction.pause:
        return `${EXTERNAL_API.rootApi}/programs/${linkCreationInfo.programId}/registrations/${linkCreationInfo.referenceId}/financial-service-providers/cards/${linkCreationInfo.tokenCode}?pause=true`;
      case VisaCardAction.unpause:
        return `${EXTERNAL_API.rootApi}/programs/${linkCreationInfo.programId}/registrations/${linkCreationInfo.referenceId}/financial-service-providers/cards/${linkCreationInfo.tokenCode}?pause=false`;
      case VisaCardAction.reissue:
        return `${EXTERNAL_API.rootApi}/programs/${linkCreationInfo.programId}/registrations/${linkCreationInfo.referenceId}/financial-service-providers/cards`;
    }
  }
}
