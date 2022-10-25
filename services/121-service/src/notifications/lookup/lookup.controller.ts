import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PhoneNumberDto } from './dto/phone-number.dto';
import { LookupService } from './lookup.service';

@ApiTags('notifications')
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
