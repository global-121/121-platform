import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { TwilioMessagesCreateDto } from '@mock-service/src/twilio/twilio.dto';
import { TwilioService } from '@mock-service/src/twilio/twilio.service';

@ApiTags('twilio')
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
    console.info(`GET api/v1/PhoneNumbers/${phoneNumber}`);

    return await this.twilioService.fetchPhoneNumber(phoneNumber);
  }

  @ApiOperation({ summary: 'Create message ' })
  @ApiParam({
    name: 'accountSid',
    required: true,
    type: 'string',
    description: 'Starts with "AC".',
  })
  @Post('2010-04-01/Accounts/:accountSid/Messages.json')
  public createMessage(
    @Body() twilioMessagesCreateDto: TwilioMessagesCreateDto | any,
    @Param('accountSid') accountSid: string,
  ): Record<string, unknown> {
    console.info(`POST api/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      ...twilioMessagesCreateDto,
      Body: twilioMessagesCreateDto.Body?.substring(0, 42).concat('…'),
    });

    return this.twilioService.createMessage(
      twilioMessagesCreateDto,
      accountSid,
    );
  }

  @ApiOperation({
    summary:
      'Fetch message. We only mocked a body return when getting by messageSid for message created with a contentSid as this is the only part that is used in the 121-service',
  })
  @ApiParam({
    name: 'messageSid',
    required: true,
    type: 'string',
    description: 'Message SID returned from Twilio',
  })
  @Get('2010-04-01/Accounts/:accountSid/Messages/:messageSid.json')
  public async fetchMessage(
    @Param('accountSid') accountSid: string,
    @Param('messageSid') messageSid: string,
  ): Promise<{ body: string }> {
    console.info(
      `GET api/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`,
    );
    return this.twilioService.fetchMessage({ messageSid });
  }
}
