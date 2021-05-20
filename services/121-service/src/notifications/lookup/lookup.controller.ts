import { Controller, Post, Body } from '@nestjs/common';
import { ApiUseTags, ApiResponse } from '@nestjs/swagger';
import { LookupService } from './lookup.service';
import { PhoneNumberDto } from './dto/phone-number.dto';

@ApiUseTags('notifications')
@Controller('notifications/lookup')
export class LookupController {
  private readonly lookupService: LookupService;
  public constructor(lookupService: LookupService) {
    this.lookupService = lookupService;
  }

  @ApiResponse({
    status: 200,
    description: 'Succesfully looked up telephone number',
  })
  @Post()
  public async lookupPhoneNr(@Body() phoneNrDto: PhoneNumberDto): Promise<any> {
    return await this.lookupService.lookupPhoneNr(phoneNrDto.phoneNumber);
  }
}
