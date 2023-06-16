import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { SafaricomService } from './safaricom.service';
import { SafaricomApiService } from './safaricom.api.service';
//import { SafaricomTransferPayload } from './safaricom-transfer-payload.dto';
import { SafaricomTransferPayloadDto } from './safaricom-transfer-payload.dto';
@ApiTags('payments/safaricom')
@Controller('safaricom')
export class SafaricomController {
  constructor(private readonly safaricomService: SafaricomService, private readonly safaricomApiService: SafaricomApiService) {}
  @ApiBody({ isArray: true, type: SafaricomTransferPayloadDto })
  @ApiOperation({ summary: 'Make Safaricom payment' })
  @ApiResponse({ status: 201, description: 'Notified' })
  @Post('make-payment')
  
  public async makePayment(
    
    @Body() 
//     payload: SafaricomTransferPayload): Promise<any> {
//     console.log("TEST");
//     try {
//       console.log("TESTSuccess");
//       const paymentResponse = await this.safaricomApiService.makePayment(payload);
//       return paymentResponse;
//     } catch (error) {

//       console.log("TESTError");
//       throw new Error('Failed to make payment');
//     }
//   }
// }
belcashCallbackData: SafaricomTransferPayloadDto,
  ): Promise<void> {
    await this.safaricomApiService.makePayment(belcashCallbackData);
    ;
  }
}
