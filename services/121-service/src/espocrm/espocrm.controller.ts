import {
  Body,
  Controller,
  ParseArrayPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from '../guards/admin.decorator';
import { DeleteRegistrationDto } from '../registration/dto/delete-registration.dto';
import { UpdateRegistrationDto } from '../registration/dto/update-registration.dto';
import { EspocrmWebhookDto } from './dto/espocrm-webhook.dto';
import { EspocrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspocrEntityTypeEnum } from './espocrm-entity-type';
import { EspocrmService } from './espocrm.service';
import { Espocrm } from './guards/espocrm.decorator';
import { EspocrmGuard } from './guards/espocrm.guard';

const espocrmIp = process.env.ESPOCRM_IP;

@UseGuards(EspocrmGuard)
@ApiTags('espocrm')
@Controller('espocrm')
export class EspocrmController {
  public constructor(private readonly espocrmService: EspocrmService) {}

  @Espocrm(
    EspocrmActionTypeEnum.update,
    EspocrEntityTypeEnum.registration,
    espocrmIp,
  )
  @ApiOperation({ summary: 'Update a registration via a EspoCRM webhook' })
  @ApiResponse({ status: 200, description: 'Updated registration' })
  @ApiBody({ isArray: true, type: UpdateRegistrationDto })
  @Post('update-registration')
  public async updateRegistration(
    @Body(new ParseArrayPipe({ items: UpdateRegistrationDto }))
    updateRegistrationsDto: UpdateRegistrationDto[],
  ): Promise<void> {
    this.espocrmService.updateRegistrations(updateRegistrationsDto);
  }

  @Espocrm(
    EspocrmActionTypeEnum.delete,
    EspocrEntityTypeEnum.registration,
    espocrmIp,
  )
  @ApiOperation({ summary: 'Delete a registration via a EspoCRM webhook' })
  @ApiResponse({ status: 200, description: 'Deleted registration' })
  @ApiBody({ isArray: true, type: DeleteRegistrationDto })
  @Post('delete-registration')
  public async deleteRegistration(
    @Body() deleteRegistrationsDto: DeleteRegistrationDto[],
  ): Promise<void> {
    this.espocrmService.deleteRegistrations(deleteRegistrationsDto);
  }

  @Admin()
  @ApiOperation({ summary: 'Post webhook integration EspoCRM webhook' })
  @ApiResponse({
    status: 200,
    description: 'Saving of the webhook was successful',
  })
  @Post('webhooks')
  public async postWebhookIntegration(
    @Body() data: EspocrmWebhookDto,
  ): Promise<void> {
    this.espocrmService.postWebhookIntegration(data);
  }
}
