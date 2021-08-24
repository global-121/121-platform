import { StatusEnum } from 'src/shared/enum/status.enum';

import { fspName } from '../financial-service-provider.entity';

export class FspTransactionResultDto {
  public fspName: fspName;
  public paList: PaTransactionResultDto[];
}

export class PaymentAddressTransactionResultDto {
  public paymentAddress: string;
  public paTransactionResultList: PaTransactionResultDto[];
  public status: StatusEnum;
  public message: string;
  public customData?: any;
}

export class PaTransactionResultDto {
  public referenceId: string;
  public status: StatusEnum;
  public message: string;
  public date?: Date;
  public customData?: any;
  public calculatedAmount: number;
}
