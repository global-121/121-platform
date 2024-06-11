import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { UpdateOrganizationDto } from '@121-service/src/organization/dto/update-organization.dto';
import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { OrganizationService } from '@121-service/src/organization/organization.service';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  private readonly organizationService: OrganizationService;
  public constructor(organizationService: OrganizationService) {
    this.organizationService = organizationService;
  }

  @ApiOperation({ summary: 'Get organization data' })
  @Get()
  public async getOrganization(): Promise<OrganizationEntity> {
    return await this.organizationService.getOrganization();
  }

  // TODO: we assume only 1 organization. Therefore not patching by organization-id/name. This could be changed in the future.
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Update organization data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully updated organization',
    type: OrganizationEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No organization found',
    type: OrganizationEntity,
  })
  @Patch()
  public async updateOrganization(
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationEntity> {
    return await this.organizationService.updateOrganization(
      updateOrganizationDto,
    );
  }
}
