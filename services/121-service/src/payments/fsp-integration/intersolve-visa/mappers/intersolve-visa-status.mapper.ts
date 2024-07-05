import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-action.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import csvParser from 'csv-parser';
import fs from 'fs';
import * as path from 'path';

const StatusUnknownExplain = `Status is unknown, please contact the 121 Platform Team`;

interface VisaCard121StatusMapInterface {
  TokenBlocked: boolean;
  TokenStatus: string;
  CardStatus: string;
  VisaCard121Status: string;
  VisaCard121StatusExplanation: string;
  Actions121: string;
}

interface VisaCard121StatusInformation {
  status: VisaCard121Status;
  explanation: string;
}

const VisaCardActionsMapping = {
  Pause: VisaCardAction.pause,
  Unpause: VisaCardAction.unpause,
  'Issue New Card': VisaCardAction.reissue,
};

export class IntersolveVisaStatusMapper {
  private static mapping: VisaCard121StatusMapInterface[] = [];

  constructor() {
    IntersolveVisaStatusMapper.loadMapping();
  }

  public static loadMapping(): void {
    const csvFilePath = path.join(__dirname, 'visa-card-121-status-map.csv');
    fs.createReadStream(csvFilePath)
      .pipe(csvParser({ separator: ';' }))
      .on('data', (row) => {
        const mappingRow: VisaCard121StatusMapInterface = {
          TokenBlocked: row.TokenBlocked ? row.TokenBlocked === 'TRUE' : false,
          TokenStatus: row.TokenStatus ? row.TokenStatus.trim() : '',
          CardStatus: row.CardStatus ? row.CardStatus.trim() : '',
          VisaCard121Status: row['VisaCard121Status']
            ? row['VisaCard121Status'].trim()
            : VisaCard121Status.Unknown,
          VisaCard121StatusExplanation: row.Explanation
            ? row.Explanation.trim()
            : '',
          Actions121: row.Actions ? row.Actions.trim() : null,
        };
        IntersolveVisaStatusMapper.mapping.push(mappingRow);
      });
  }

  public static determineVisaCard121StatusInformation({
    tokenBlocked,
    walletStatus,
    cardStatus,
  }: {
    tokenBlocked: boolean;
    walletStatus: IntersolveVisaTokenStatus | null;
    cardStatus: IntersolveVisaCardStatus | null;
  }): VisaCard121StatusInformation {
    const matchingRow = IntersolveVisaStatusMapper.mapping.find(
      (row) =>
        row.TokenBlocked === tokenBlocked &&
        row.TokenStatus === walletStatus &&
        row.CardStatus === cardStatus,
    );
    if (matchingRow) {
      return {
        status: matchingRow['VisaCard121Status'] as VisaCard121Status,
        explanation: matchingRow['VisaCard121StatusExplanation'],
      };
    } else {
      return {
        status: VisaCard121Status.Unknown,
        explanation: StatusUnknownExplain,
      };
    }
  }
}
