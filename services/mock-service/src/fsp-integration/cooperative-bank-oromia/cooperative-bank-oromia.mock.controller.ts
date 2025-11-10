import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CooperativeBankOromiaMockService } from '@mock-service/src/fsp-integration/cooperative-bank-oromia/cooperative-bank-oromia.mock.service';

export class CooperativeBankOromiaTransactionMockPayload {
  Data: {
    from_account: string;
    to_account: string;
    amount: number;
    currency: string;
    description: string;
  };
}

@ApiTags('fsp/cooperative-bank-oromia')
@Controller('fsp/cooperative-bank-oromia')
export class CooperativeBankOromiaMockController {
  public constructor(
    private readonly cooperativeBankOromiaMockService: CooperativeBankOromiaMockService,
  ) {}

  @ApiOperation({ summary: 'Payment for services' })
  @Post('api/transactions')
  public transaction(
    @Body() body: CooperativeBankOromiaTransactionMockPayload,
  ): object {
    return this.cooperativeBankOromiaMockService.transaction(body);
  }
}
