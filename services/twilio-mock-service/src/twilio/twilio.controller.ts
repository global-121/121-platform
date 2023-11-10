import { Body, Controller, Get, Post, Param } from '@nestjs/common';
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
  @Get('v1/PhoneNumbers/:phoneNumber')
  public fetchPhoneNumber(@Param('phoneNumber') phoneNumber: string): {
    phoneNumber: string;
    nationalFormat: string;
  } {
    return this.twilioService.fetchPhoneNumber(phoneNumber);
  }

  @ApiOperation({ summary: 'Create message ' })
  @Post('2010-04-01/Accounts/:accountSid/Messages.json')
  public createMessage(
    @Body() twilioMessagesCreateDto: any,
    @Param('accountSid') accountSid: string
    ): object {
    return this.twilioService.createMessage(twilioMessagesCreateDto, accountSid);
  }
}
