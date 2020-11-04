import { ApiModelProperty } from '@nestjs/swagger';

import { fspName } from '../financial-service-provider.entity';

export class PaPaymentDataDto {
  public did: string;
  public paymentAddress: string;
  public fspName: fspName;
}
