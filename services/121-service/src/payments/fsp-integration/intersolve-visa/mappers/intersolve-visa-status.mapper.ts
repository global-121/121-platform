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
  ChildTokenBlocked: boolean;
  ChildTokenStatus: string;
  CardStatus: string;
  '121VisaCardStatus': string;
  '121VisaCardStatusExplanation': string;
  '121Actions': string;
}

interface Visa121StatusInfoDto {
  walletStatus121: WalletCardStatus121;
  explanation: string;
  links: VisaCardActionLinkDto[];
}

interface MapVisaStatusInfoParams {
  tokenBlocked: boolean;
  walletStatus: IntersolveVisaTokenStatus | null;
  cardStatus: IntersolveVisaCardStatus | null;
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
          ChildTokenBlocked: row.TokenBlocked
            ? row.TokenBlocked === 'TRUE'
            : false,
          ChildTokenStatus: row.WalletStatus ? row.WalletStatus.trim() : '',
          CardStatus: row.CardStatus ? row.CardStatus.trim() : '',
          '121VisaCardStatus': row['121VisaCardStatus']
            ? row['121VisaCardStatus'].trim()
            : WalletCardStatus121.Unknown,
          '121VisaCardStatusExplanation': row.Explanation
            ? row.Explanation.trim()
            : '',
          '121Actions': row.Actions ? row.Actions.trim() : null,
        };
        IntersolveVisaStatusMapper.mapping.push(mappingRow);
      });
  }

  public static map121StatusInfo(
    params: MapVisaStatusInfoParams,
  ): Visa121StatusInfoDto {
    const matchingRow = IntersolveVisaStatusMapper.mapping.find(
      (row) =>
        row.ChildTokenBlocked === params.tokenBlocked &&
        row.ChildTokenStatus === params.walletStatus &&
        row.CardStatus === params.cardStatus,
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
