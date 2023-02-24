import { Body, Controller, ParseArrayPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteRegistrationDto } from '../registration/dto/delete-registration.dto';
import { UpdateRegistrationDto } from '../registration/dto/update-registration.dto';
import { EspocrmService } from './espocrm.service';

@ApiTags('espocrm')
@Controller('espocrm')
export class EspocrmController {
  public constructor(private readonly espocrmService: EspocrmService) {}

  @ApiOperation({ summary: 'Update a registration via a EspoCRM webhook' })
  @ApiResponse({ status: 200, description: 'Updated registration' })
  @Post('update-registration')
  public async updateRegistration(
    @Body(new ParseArrayPipe({ items: UpdateRegistrationDto }))
    updateRegistrationDto: UpdateRegistrationDto[],
  ): Promise<void> {
    this.espocrmService.updateRegistration(updateRegistrationDto);
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
