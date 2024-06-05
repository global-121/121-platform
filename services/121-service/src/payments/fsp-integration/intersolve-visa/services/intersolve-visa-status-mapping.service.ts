import { EXTERNAL_API } from '@121-service/src/config';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import {
  IntersolveVisaCardStatus,
  IntersolveVisaWalletStatus,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { ApiProperty } from '@nestjs/swagger';
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

class VisaStatusInfoDto {
  public walletStatus121: WalletCardStatus121;
  public explanation: string;
  public links: VisaCardActionLink[];
}

class VisaCardLinkCreationInfo {
  public referenceId: string; // ReferenceId of the registration
  public programId: number;
  public tokenCode: string;
}

enum VisaCardMethod {
  POST = 'POST',
  PUT = 'PUT',
}

enum VisaCardAction {
  pause = 'pause',
  unpause = 'unpause',
  reissue = 'reissue',
}

export class VisaCardActionLink {
  @ApiProperty()
  href: string;
  @ApiProperty({ enum: VisaCardAction })
  action: VisaCardAction;
  @ApiProperty({ enum: VisaCardMethod })
  method: VisaCardMethod;
}

const VisaCardActionsMapping = {
  Pause: VisaCardAction.pause,
  Unpause: VisaCardAction.unpause,
  'Issue New Card': VisaCardAction.reissue,
};

export class IntersolveVisaStatusMappingService {
  private readonly mapping: VisaStatusMapInterface[] = [];

  constructor() {
    this.loadMapping();
  }

  private loadMapping(): void {
    const csvFilePath = path.join(__dirname, 'visaStatusMap.csv'); // Adjust the path to your CSV file
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
        this.mapping.push(mappingRow);
      });
  }

  public determine121StatusInfo(
    tokenBlocked: boolean,
    walletStatus: IntersolveVisaWalletStatus | null,
    cardStatus: IntersolveVisaCardStatus | null,
    isCurrentWallet: boolean,
    linkCreationInfo: VisaCardLinkCreationInfo,
  ): VisaStatusInfoDto {
    const matchingRow = this.mapping.find(
      (row) =>
        row.TokenBlocked === tokenBlocked &&
        row.WalletStatus === walletStatus &&
        row.CardStatus === cardStatus &&
        row.IsCurrentWallet === isCurrentWallet,
    );
    if (matchingRow) {
      return {
        walletStatus121: matchingRow['121Status'] as WalletCardStatus121,
        explanation: matchingRow['Explanation'],
        links: this.getLinks(matchingRow['Actions'], linkCreationInfo),
      };
    } else {
      return {
        walletStatus121: WalletCardStatus121.Unknown,
        explanation: StatusUnknownExplain,
        links: [],
      };
    }
  }

  private getLinks(
    actions: string,
    linkCreationInfo: VisaCardLinkCreationInfo,
  ): VisaCardActionLink[] {
    if (!actions) {
      return [];
    }

    const links: VisaCardActionLink[] = [];
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
              ? VisaCardMethod.PUT
              : VisaCardMethod.POST,
        };
        links.push(link);
      }
    }
    return links;
  }

  private buildHref(
    action: VisaCardAction,
    linkCreationInfo: VisaCardLinkCreationInfo,
  ): string {
    switch (action) {
      case VisaCardAction.pause:
        return `${EXTERNAL_API.rootApi}/programs/${linkCreationInfo.programId}/financial-service-providers/intersolve-visa/wallets/${linkCreationInfo.tokenCode}/block`;
      case VisaCardAction.unpause:
        return `${EXTERNAL_API.rootApi}/programs/${linkCreationInfo.programId}/financial-service-providers/intersolve-visa/wallets/${linkCreationInfo.tokenCode}/unblock`;
      case VisaCardAction.reissue:
        return `${EXTERNAL_API.rootApi}/programs/${linkCreationInfo.programId}/financial-service-providers/intersolve-visa/customers/${linkCreationInfo.referenceId}/wallets`;
    }
  }
}
