import { Body, Controller, ParseArrayPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteRegistrationDto } from '../registration/dto/delete-registration.dto';
import { PatchRegistrationDto } from '../registration/dto/patch-registration.dto';
import { EspocrmService } from './espocrm.service';

@ApiTags('espocrm')
@Controller('espocrm')
export class EspocrmController {
  public constructor(private readonly espocrmService: EspocrmService) {}

  @ApiOperation({ summary: 'Update a registration via a EspoCRM webhook' })
  @ApiResponse({ status: 200, description: 'Updated registration' })
  @Post('update-registration')
  public async patchRegistration(
    @Body(new ParseArrayPipe({ items: PatchRegistrationDto }))
    patchRegistrationDto: PatchRegistrationDto[],
  ): Promise<void> {
    this.espocrmService.patchRegistration(patchRegistrationDto);
  }

  @ApiOperation({ summary: 'Delete a registration via a EspoCRM webhook' })
  @ApiResponse({ status: 200, description: 'Deleted registration' })
  @Post('delete-registration')
  public async deleteRegistration(
    @Body() deleteRegistrationDto: DeleteRegistrationDto[],
  ): Promise<void> {
    console.log(deleteRegistrationDto);
  }
}
