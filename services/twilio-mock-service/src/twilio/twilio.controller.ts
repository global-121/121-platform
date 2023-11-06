import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TwilioService } from './twilio.service';
import { TwilioMessagesCreateDto } from './twilio.dto';

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

  @ApiOperation({ summary: 'Create message ' })
  @Post('messages')
  public createMessage(
    @Body() twilioMessagesCreateDto: TwilioMessagesCreateDto,
  ): object {
    return this.twilioService.createMessage(twilioMessagesCreateDto);
  }
}
