import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { SafaricomService } from './safaricom.service';
import { SafaricomPaymentPayloadDto } from './dto/safaricom-payment-payload.dto';

@ApiTags('payments/safaricom')
@Controller('safaricom')
export class SafaricomController {
  constructor(private readonly safaricomService: SafaricomService) {}

  @ApiBody({ isArray: true, type: SafaricomPaymentPayloadDto })
  @Post('make-payment')
  @ApiOperation({ summary: 'Make Safaricom payment' })
  async makePayment(@Body() payload: SafaricomPaymentPayloadDto): Promise<any> {
    console.log("TEST");
    try {
      console.log("TEST");
      const paymentResponse = await this.safaricomService.makePayment(payload);
      return paymentResponse;
    } catch (error) {

      throw new Error('Failed to make payment');
    }
  }
}
