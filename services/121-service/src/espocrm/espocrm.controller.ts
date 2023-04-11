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
import { EspoCrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspoCrmEntityTypeEnum } from './espocrm-entity-type';
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
    EspoCrmActionTypeEnum.update,
    EspoCrmEntityTypeEnum.registration,
    espocrmIp,
  )
  @ApiOperation({ summary: 'Update registration(s) via a EspoCRM webhook' })
  @ApiResponse({ status: 201, description: 'Updated registration(s)' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Signature not correct or IP not whitelisted.',
  })
  @ApiBody({ isArray: true, type: UpdateRegistrationDto })
  @Post('update-registration')
  public async updateRegistrations(
    @Body(new ParseArrayPipe({ items: UpdateRegistrationDto }))
    updateRegistrationsDto: UpdateRegistrationDto[],
  ): Promise<void> {
    return await this.espocrmService.updateRegistrations(
      updateRegistrationsDto,
    );
  }

  @Espocrm(
    EspoCrmActionTypeEnum.delete,
    EspoCrmEntityTypeEnum.registration,
    espocrmIp,
  )
  @ApiOperation({ summary: 'Delete registration(s) via a EspoCRM webhook' })
  @ApiResponse({ status: 201, description: 'Deleted registration(s)' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Signature not correct or IP not whitelisted.',
  })
  @ApiResponse({
    status: 404,
    description: `Registration(s) not found or already on status 'deleted'`,
  })
  @ApiBody({ isArray: true, type: DeleteRegistrationDto })
  @Post('delete-registration')
  public async deleteRegistrations(
    @Body() deleteRegistrationsDto: DeleteRegistrationDto[],
  ): Promise<void> {
    return await this.espocrmService.deleteRegistrations(
      deleteRegistrationsDto,
    );
  }

  @Admin()
  @ApiOperation({ summary: 'Post webhook integration EspoCRM webhook' })
  @ApiResponse({
    status: 201,
    description: 'Saving of the webhook was successful',
  })
  @Post('webhooks')
  public async postWebhookIntegration(
    @Body() data: EspocrmWebhookDto,
  ): Promise<void> {
    this.espocrmService.postWebhookIntegration(data);
  }
}
