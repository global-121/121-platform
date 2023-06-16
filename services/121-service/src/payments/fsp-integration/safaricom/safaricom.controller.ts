import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { SafaricomService } from './safaricom.service';
import { SafaricomApiService } from './safaricom.api.service';
import { SafaricomTransferPayload } from './safaricom-transfer-payload.dto';

@ApiTags('payments/safaricom')
@Controller('safaricom')
export class SafaricomController {
  constructor(private readonly safaricomService: SafaricomService, private readonly safaricomApiService: SafaricomApiService) {}
  @ApiBody({ isArray: true, type: SafaricomTransferPayload })
  @Post('make-payment')
  @ApiOperation({ summary: 'Make Safaricom payment' })
  async makePayment(@Body() payload: SafaricomTransferPayload): Promise<any> {
    console.log("TEST");
    try {
      console.log("TEST");
      const paymentResponse = await this.safaricomApiService.makePayment(payload);
      return paymentResponse;
    } catch (error) {

      throw new Error('Failed to make payment');
    }
  }
}
