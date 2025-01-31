import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { NedbankMockService } from '@mock-service/src/fsp-integration/nedbank/nedbank.mock.service';

// Only contains the values that are used in the mock service
export class NedbankCreateOrderMockPayload {
  Data: {
    Initiation: {
      InstructionIdentification: string;
      InstructedAmount: {
        Amount: string;
        Currency: string;
      };
      DebtorAccount: {
        SchemeName: string;
        Identification: string;
        Name: string;
        SecondaryIdentification: string;
      };
      CreditorAccount: {
        SchemeName: string;
        Identification: string;
        Name: string;
        SecondaryIdentification: string;
      };
    };
    ExpirationDateTime: string;
  };
  Risk: {
    OrderCreateReference: string;
    OrderDateTime: string;
  };
}
@ApiTags('fsp/nedbank')
@Controller('fsp/nedbank')
export class NedbankMockController {
  public constructor(private readonly nedbankMockService: NedbankMockService) {}

  @ApiOperation({ summary: 'Make create order call' })
  @Post('/v1/orders')
  public createOrder(@Body() body: NedbankCreateOrderMockPayload): object {
    return this.nedbankMockService.createOrder(body);
  }

  @ApiOperation({ summary: 'Get order status by reference id' })
  @Get('v1/orders/references/:orderCreateReference')
  public getOrder(
    @Param('orderCreateReference') orderCreateReference: string,
  ): object {
    return this.nedbankMockService.getOrder(orderCreateReference);
  }
}
