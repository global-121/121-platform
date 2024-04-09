import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PhoneNumberDto } from './dto/phone-number.dto';
import { LookupService } from './lookup.service';

@ApiTags('notifications')
@Controller('notifications/lookup')
export class LookupController {
  private readonly lookupService: LookupService;
  public constructor(lookupService: LookupService) {
    this.lookupService = lookupService;
  }

  @ApiOperation({ summary: 'Lookup telephone number at Twilio' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Succesfully looked up telephone number',
  })
  @Post()
  public async lookupPhoneNr(@Body() phoneNrDto: PhoneNumberDto): Promise<any> {
    return await this.lookupService.lookupPhoneNr(phoneNrDto.phoneNumber);
  }
}
