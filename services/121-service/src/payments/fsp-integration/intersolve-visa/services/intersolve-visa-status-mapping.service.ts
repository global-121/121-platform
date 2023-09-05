import csvParser from 'csv-parser';
import fs from 'fs';
import * as path from 'path';
import { WalletStatus121 } from '../enum/wallet-status-121.enum';
import {
  IntersolveVisaCardStatus,
  IntersolveVisaWalletStatus,
} from './../intersolve-visa-wallet.entity';

interface VisaStatusMapInterface {
  TokenBlocked: boolean;
  WalletStatus: string;
  CardStatus: string;
  IsCurrentWallet: boolean;
  '121Status': string;
}

export class IntersolveVisaStatusMappingService {
  private readonly mapping: VisaStatusMapInterface[] = [];

  constructor() {
    this.loadMapping();
  }

  private loadMapping(): void {
    console.log('loadMapping: ');
    const csvFilePath = path.join(__dirname, 'visaStatusMap.csv'); // Adjust the path to your CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csvParser({ separator: ';' }))
      .on('data', (row) => {
        const mappingRow: VisaStatusMapInterface = {
          TokenBlocked: row.TokenBlocked === 'TRUE',
          WalletStatus: row.WalletStatus,
          CardStatus: row.CardStatus,
          IsCurrentWallet: row.IsCurrentWallet === 'TRUE',
          '121Status': row['121Status'],
        };
        this.mapping.push(mappingRow);
      });
  }

  public determine121Status(
    tokenBlocked: boolean,
    walletStatus: IntersolveVisaWalletStatus,
    cardStatus: IntersolveVisaCardStatus,
    isCurrentWallet: boolean,
  ): WalletStatus121 {
    const matchingRow = this.mapping.find(
      (row) =>
        row.TokenBlocked === tokenBlocked &&
        row.WalletStatus === walletStatus &&
        row.CardStatus === cardStatus &&
        row.IsCurrentWallet === isCurrentWallet,
    );
    if (matchingRow) {
      return matchingRow['121Status'] as WalletStatus121;
    } else {
      return WalletStatus121.Unknown;
    }
  }
}
