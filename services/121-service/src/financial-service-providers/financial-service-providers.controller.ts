import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from '../guards/admin.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminAuthGuard } from '../guards/admin.guard';
import {
  CreateFspAttributeDto,
  UpdateFinancialServiceProviderAttributeDto,
  UpdateFspDto,
} from './dto/update-financial-service-provider.dto';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FinancialServiceProviderAttributeEntity } from './financial-service-provider-attribute.entity';
import { FinancialServiceProvidersService } from './financial-service-providers.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('financial-service-providers')
@Controller('financial-service-providers')
export class FinancialServiceProviderController {
  public constructor(private readonly fspService: FinancialServiceProvidersService) {}

  @Admin()
  @ApiOperation({ summary: 'Get all Financial Service Providers.' })
  @ApiResponse({
    status: 200,
    description: 'All Financial Service Providers with attributes',
    type: [FinancialServiceProviderEntity],
  })
  @Get()
  public async getAllFsps(): Promise<FinancialServiceProviderEntity[]> {
    return await this.fspService.getAllFsps();
  }

  @ApiOperation({ summary: 'Get Financial Service Provider (FSP) by fspId.' })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Fsp with attributes',
    type: FinancialServiceProviderEntity,
  })
  @Get(':fspId')
  public async getFspById(
    @Param() param,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.getFspById(param.fspId);
  }

  @Admin()
  @ApiOperation({ summary: 'Update Financial Service Provider' })
  @ApiResponse({
    status: 200,
    description: 'Financial Service Provicer updated',
    type: FinancialServiceProviderEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'No Financial Service Provicer found with given id',
  })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
  @Patch(':fspId')
  public async updateFsp(
    @Param('fspId') fspId: number,
    @Body() updateFspDto: UpdateFspDto,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.updateFsp(Number(fspId), updateFspDto);
  }

  @Admin()
  @ApiOperation({ summary: 'Update FSP attribute' })
  @ApiResponse({
    status: 200,
    description: 'FSP attribute updated',
    type: FinancialServiceProviderAttributeEntity,
  })
  @ApiResponse({
    status: 404,
    description:
      'No attribute with given name found in Financial Service Provicer with given id',
  })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiParam({ name: 'attributeName', required: true, type: 'string' })
  @Patch(':fspId/attribute/:attributeName')
  public async updateFspAttribute(
    @Param() params,
    @Body() updateFspAttributeDto: UpdateFinancialServiceProviderAttributeDto,
  ): Promise<FinancialServiceProviderAttributeEntity> {
    return await this.fspService.updateFspAttribute(
      Number(params.fspId),
      params.attributeName,
      updateFspAttributeDto,
    );
  }

  @Admin()
  @ApiOperation({ summary: 'Create FSP attribute' })
  @ApiResponse({
    status: 201,
    description: 'FSP attribute created',
    type: FinancialServiceProviderAttributeEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Attribute with given name already exists for given FSP',
  })
  @ApiResponse({
    status: 404,
    description: 'No Financial Service Provicer found with given id',
  })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
  @Post(':fspId/attribute')
  public async createFspAttribute(
    @Param() params,
    @Body() createFspAttributeDto: CreateFspAttributeDto,
  ): Promise<FinancialServiceProviderAttributeEntity> {
    return await this.fspService.createFspAttribute(
      Number(params.fspId),
      createFspAttributeDto,
    );
  }

  @Admin()
  @ApiOperation({ summary: 'Delete FSP attribute' })
  @ApiResponse({
    status: 200,
    description: 'FSP attribute deleted',
    type: FinancialServiceProviderAttributeEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'No attribut with given name found for given fspId',
  })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiParam({ name: 'attributeName', required: true, type: 'string' })
  @Delete(':fspId/attribute/:attributeName')
  public async deleteFspAttribute(@Param() params): Promise<FinancialServiceProviderAttributeEntity> {
    return await this.fspService.deleteFspAttribute(
      Number(params.fspId),
      params.attributeName,
    );
  }
}
