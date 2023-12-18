import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TwilioService } from './twilio.service';

@ApiTags('1. twilio')
@Controller()
export class TwilioController {
  public constructor(private readonly twilioService: TwilioService) {}

  @ApiOperation({ summary: 'Fetch phoneNumber ' })
  @ApiParam({
    name: 'phoneNumber',
    required: true,
    type: 'string',
  })
  @Get('v1/PhoneNumbers/:phoneNumber')
  public async fetchPhoneNumber(
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<{
    phone_number: string;
    national_format: string;
  }> {
    return await this.twilioService.fetchPhoneNumber(phoneNumber);
  }

  @ApiOperation({ summary: 'Create message ' })
  @ApiParam({
    name: 'accountSid',
    required: true,
    type: 'string',
  })
  @Post('2010-04-01/Accounts/:accountSid/Messages.json')
  public createMessage(
    @Body() twilioMessagesCreateDto: any,
    @Param('accountSid') accountSid: string,
  ): object {
    return this.twilioService.createMessage(
      twilioMessagesCreateDto,
      accountSid,
    );
  }
}
