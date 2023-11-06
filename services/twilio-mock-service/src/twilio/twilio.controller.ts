import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TwilioService } from './twilio.service';

@Controller()
export class TwilioController {
  public constructor(private readonly twilioService: TwilioService) {}

  @ApiOperation({ summary: 'Fetch phoneNumber ' })
  @ApiQuery({
    name: 'phoneNumber',
    required: true,
    type: 'string',
  })
  @Get('lookups/phonenumbers')
  public fetchPhoneNumber(@Query('phoneNumber') phoneNumber: string): {
    phoneNumber: string;
    nationalFormat: string;
  } {
    return this.twilioService.fetchPhoneNumber(phoneNumber);
  }
}
