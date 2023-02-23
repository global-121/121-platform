import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PatchRegistrationDto } from '../registration/dto/patch-registration.dto';

@ApiTags('espocrm')
@Controller('espocrm')
export class EspoCrmController {
  @ApiOperation({ summary: 'Updated a registration' })
  @ApiResponse({ status: 200, description: 'Updated registration' })
  @Post('update-registration')
  public async update(
    @Body() updateRegistrationDto: PatchRegistrationDto[],
  ): Promise<void> {
    console.log(updateRegistrationDto);
  }
}
