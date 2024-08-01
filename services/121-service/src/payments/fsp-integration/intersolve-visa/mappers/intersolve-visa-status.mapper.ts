import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-action.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
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
  private static isMappingLoaded = false;

  // TODO: This function has a bug since loading the CSV file is asynchronous, so the first time after compiling the status is Unknown, and afterwards it works. Change into a synchronous way with the help of Copilot, but not with csv-parse. Or try to load the mapping in another place? The IntersolveVisaService constructor? Test this, since the mapper is also used in the MetricsService.
  public static loadMapping(): void {
    if (this.isMappingLoaded) {
      return;
    }

    const csvFilePath = path.join(__dirname, 'visa-card-121-status-map.csv');
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    const rows = fileContent.split('\n').filter((row) => row.trim()); // Filters out empty lines

    if (rows.length > 0) {
      const headers = rows
        .shift()
        .split(';')
        .map((header) => header.trim().replace(/^"|"$/g, '')); // Remove quotes from headers

      rows.forEach((row) => {
        const columns = row.split(';').map((column) => column.trim());
        const rowObject = headers.reduce((obj, nextKey, index) => {
          obj[nextKey] = columns[index].replace(/^"|"$/g, ''); // Remove quotes from values
          return obj;
        }, {});

        const mappingRow: VisaCard121StatusMapInterface = {
          TokenBlocked: rowObject['TokenBlocked'] === 'TRUE',
          TokenStatus: rowObject['TokenStatus'],
          CardStatus: rowObject['CardStatus'],
          VisaCard121Status: rowObject['VisaCard121Status']
            ? rowObject['VisaCard121Status']
            : 'Unknown', // No need to trim, already done
          VisaCard121StatusExplanation:
            rowObject['VisaCard121StatusExplanation'],
          Actions121: rowObject['Actions121'],
        };
        this.mapping.push(mappingRow);
      });
    }

    this.isMappingLoaded = true;
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
