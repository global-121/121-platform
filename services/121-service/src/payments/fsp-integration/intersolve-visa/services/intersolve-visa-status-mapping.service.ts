import { EXTERNAL_API } from '@121-service/src/config';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { ApiProperty } from '@nestjs/swagger';
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

// TODO: REFACTOR: IMO Move into IntersolveVisaService. Make sure it does not depend on anything outside of this Module.
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
        this.mapping.push(mappingRow);
      });
  }

  public determine121StatusInfo(
    tokenBlocked: boolean,
    walletStatus: IntersolveVisaTokenStatus | null,
    cardStatus: IntersolveVisaCardStatus | null,
    linkCreationInfo: VisaCardLinkCreationInfo,
  ): VisaStatusInfoDto {
    const matchingRow = this.mapping.find(
      (row) =>
        row.ChildTokenBlocked === tokenBlocked &&
        row.ChildTokenStatus === walletStatus &&
        row.CardStatus === cardStatus,
    );
    if (matchingRow) {
      return {
        walletStatus121: matchingRow[
          '121VisaCardStatus'
        ] as WalletCardStatus121,
        explanation: matchingRow['121VisaCardStatusExplanation'],
        links: this.getLinks(matchingRow['121Actions'], linkCreationInfo),
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
