import {
  Body,
  Controller,
  ParseArrayPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from '../guards/admin.decorator';
import { DeleteRegistrationDto } from '../registration/dto/delete-registration.dto';
import { PatchRegistrationDto } from '../registration/dto/patch-registration.dto';
import { EspocrmWebhookDto } from './dto/espocrm-webhook.dto';
import { EspocrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspocrEntityTypeEnum } from './espocrm-entity-type';
import { EspocrmService } from './espocrm.service';
import { Espocrm } from './guards/espocrm.decorator';
import { EspocrmGuard } from './guards/espocrm.guard';

@UseGuards(EspocrmGuard)
@ApiTags('espocrm')
@Controller('espocrm')
export class EspocrmController {
  public constructor(private readonly espocrmService: EspocrmService) {}

  @Espocrm(EspocrmActionTypeEnum.update, EspocrEntityTypeEnum.registration)
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

  @Admin()
  @ApiOperation({ summary: 'Post webhook integration EspoCRM webhook' })
  @ApiResponse({ status: 200, description: 'Posted webhook integration' })
  @Post('webhooks')
  public async postWebhookIntegration(
    @Body() data: EspocrmWebhookDto,
  ): Promise<void> {
    this.espocrmService.postWebhookIntegration(data);
  }
}
