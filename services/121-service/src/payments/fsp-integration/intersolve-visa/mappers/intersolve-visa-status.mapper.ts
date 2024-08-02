import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-action.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import fs from 'fs';
import * as path from 'path';

const StatusUnknownExplain = `Status is unknown, please contact the 121 Platform Team`;
const CardDataMissingExplanation = `Unable to retrieve card data, refresh the page or try to reissue the card if you expect the card was never created. If the issue persists, please contact the 121 Platform Team`;

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

  public static loadMapping(): void {
    if (this.isMappingLoaded) {
      return;
    }
    const fileName = 'visa-card-121-status-map.csv';
    const csvFilePath = path.join(__dirname, fileName);
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    const rows = fileContent.split('\n').filter((row) => row.trim()); // Filters out empty lines

    if (rows.length > 0) {
      const headerRow = rows.shift();

      // Header row should always be present, this was needed to avoid a type error
      if (!headerRow) {
        throw new Error(`Header row not found in CSV file ${fileName}`);
      }
      const headers = headerRow
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

  /**
   * This function determines the status information and actions for a Visa card.
   * - It first loads the mapping from a CSV file if it hasn't been loaded yet.
   * - It then finds the row in the mapping that matches the given token blocked status, wallet status, and card status.
   * - If a matching row is found, it creates an array of actions from the row's Actions121 field, maps each action to a VisaCardAction enum value, and returns an object with the row's status, explanation, and actions.
   * - If the cards status is missing it will retrun the accosiacted status
   * - If no matching row is found, it returns an object with an unknown status, a default explanation, and no actions.
   *
   * @param {boolean} input.isTokenBlocked - Whether the token is blocked.
   * @param {IntersolveVisaTokenStatus} input.walletStatus - The status of the wallet.
   * @param {IntersolveVisaCardStatus | null} input.cardStatus - The status of the card, or null if there is no card.
   * @returns {VisaCard121StatusInformationAndActions} The status information and actions for the Visa card.
   */
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
    const cardStatusString = cardStatus ? cardStatus : ''; // CSV file has empty strings for null values
    const matchingRow = IntersolveVisaStatusMapper.mapping.find(
      (row) =>
        row.TokenBlocked === isTokenBlocked &&
        row.TokenStatus === walletStatus &&
        row.CardStatus === cardStatusString,
    );
    if (matchingRow) {
      let actionsArray: VisaCardAction[] = [];
      if (matchingRow.Actions121) {
        actionsArray = matchingRow.Actions121.split(',').map(
          (item) => item.trim() as VisaCardAction,
        );
      }
      return {
        status: matchingRow['VisaCard121Status'] as VisaCard121Status,
        explanation: matchingRow['VisaCard121StatusExplanation'],
        actions: actionsArray,
      };
    }

    if (!cardStatus) {
      return {
        status: VisaCard121Status.CardDataMissing,
        explanation: CardDataMissingExplanation,
        actions: [VisaCardAction.reissue],
      };
    }

    return {
      status: VisaCard121Status.Unknown,
      explanation: StatusUnknownExplain,
      actions: [],
    };
  }
}
