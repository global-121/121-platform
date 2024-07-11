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

interface VisaCard121StatusInformationAndActions {
  status: VisaCard121Status;
  explanation: string;
  actions: VisaCardAction[];
}

export class IntersolveVisaStatusMapper {
  private static mapping: VisaCard121StatusMapInterface[] = [];
  private static isMappingLoaded: boolean = false;

  // TODO: This function has a bug since loading the CSV file is asynchronous, so the first time after compiling the status is Unknown, and afterwards it works. Change into a synchronous way with the help of Copilot, but not with csv-parse. Or try to load the mapping in another place? The IntersolveVisaService constructor? Test this, since the mapper is also used in the MetricsService.
  public static loadMapping(): void {
    if (!IntersolveVisaStatusMapper.isMappingLoaded) {
      const csvFilePath = path.join(__dirname, 'visa-card-121-status-map.csv');
      fs.createReadStream(csvFilePath)
        .pipe(csvParser({ separator: ';' }))
        .on('data', (row) => {
          const mappingRow: VisaCard121StatusMapInterface = {
            TokenBlocked: row.TokenBlocked
              ? row.TokenBlocked === 'TRUE'
              : false,
            TokenStatus: row.TokenStatus ? row.TokenStatus.trim() : '',
            CardStatus: row.CardStatus ? row.CardStatus.trim() : '',
            VisaCard121Status: row['VisaCard121Status']
              ? row['VisaCard121Status'].trim()
              : VisaCard121Status.Unknown,
            VisaCard121StatusExplanation: row['VisaCard121StatusExplanation']
              ? row['VisaCard121StatusExplanation'].trim()
              : '',
            Actions121: row['Actions121'] ? row['Actions121'].trim() : '',
          };
          IntersolveVisaStatusMapper.mapping.push(mappingRow);
        })
        .on('end', () => {
          IntersolveVisaStatusMapper.isMappingLoaded = true; // Set the flag to true after initialization
        });
    }
  }

  public static determineVisaCard121StatusInformation({
    isTokenBlocked,
    walletStatus,
    cardStatus,
  }: {
    isTokenBlocked: boolean;
    walletStatus: IntersolveVisaTokenStatus; // | null;
    cardStatus: IntersolveVisaCardStatus | null;
  }): VisaCard121StatusInformationAndActions {
    IntersolveVisaStatusMapper.loadMapping();

    const matchingRow = IntersolveVisaStatusMapper.mapping.find(
      (row) =>
        row.TokenBlocked === isTokenBlocked &&
        row.TokenStatus === walletStatus &&
        row.CardStatus === cardStatus,
    );
    if (matchingRow) {
      let actionsArray: VisaCardAction[] = [];
      if (matchingRow.Actions121) {
        actionsArray = matchingRow.Actions121.split(',').map(
          (item) => item.trim() as VisaCardAction, // TODO: Is there a better way to do this then using 'as'?
        );
      }
      return {
        status: matchingRow['VisaCard121Status'] as VisaCard121Status,
        explanation: matchingRow['VisaCard121StatusExplanation'],
        actions: actionsArray,
      };
    } else {
      return {
        status: VisaCard121Status.Unknown,
        explanation: StatusUnknownExplain,
        actions: [],
      };
    }
  }
}
