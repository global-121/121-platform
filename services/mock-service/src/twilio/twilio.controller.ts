import { TwilioMessagesCreateDto } from '@mock-service/src/twilio/twilio.dto';
import { TwilioService } from '@mock-service/src/twilio/twilio.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

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
    console.info('GET api/v1/PhoneNumbers/:phoneNumber', phoneNumber);

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
    @Body() twilioMessagesCreateDto: TwilioMessagesCreateDto,
    @Param('accountSid') accountSid: string,
  ): object {
    console.info('POST api/2010-04-01/Accounts/:accountSid/Messages.json', {
      ...twilioMessagesCreateDto,
      Body: twilioMessagesCreateDto.Body?.substring(0, 42).concat('…'),
    });

    return this.twilioService.createMessage(
      twilioMessagesCreateDto,
      accountSid,
    );
  }
}
