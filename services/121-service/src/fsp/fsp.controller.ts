import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../guards/authenticated-user.guard';
import {
  CreateFspAttributeDto,
  UpdateFspAttributeDto,
  UpdateFspDto,
} from './dto/update-fsp.dto';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FspQuestionEntity } from './fsp-question.entity';
import { FspService } from './fsp.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers')
@Controller('financial-service-providers')
export class FspController {
  public constructor(private readonly fspService: FspService) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Get all Financial Service Providers.' })
  @ApiResponse({
    status: HttpStatus.OK,
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
    status: HttpStatus.OK,
    description: 'Fsp with attributes',
    type: FinancialServiceProviderEntity,
  })
  @Get(':fspId')
  public async getFspById(
    @Param() param,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.getFspById(param.fspId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Update Financial Service Provider' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial Service Provicer updated',
    type: FinancialServiceProviderEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
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

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Update FSP attribute' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'FSP attribute updated',
    type: FspQuestionEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'No attribute with given name found in Financial Service Provicer with given id',
  })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiParam({ name: 'attributeName', required: true, type: 'string' })
  @Patch(':fspId/attribute/:attributeName')
  public async updateFspAttribute(
    @Param() params,
    @Body() updateFspAttributeDto: UpdateFspAttributeDto,
  ): Promise<FspQuestionEntity> {
    return await this.fspService.updateFspAttribute(
      Number(params.fspId),
      params.attributeName,
      updateFspAttributeDto,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Create FSP attribute' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'FSP attribute created',
    type: FspQuestionEntity,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Attribute with given name already exists for given FSP',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No Financial Service Provicer found with given id',
  })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
  @Post(':fspId/attribute')
  public async createFspAttribute(
    @Param() params,
    @Body() createFspAttributeDto: CreateFspAttributeDto,
  ): Promise<FspQuestionEntity> {
    return await this.fspService.createFspAttribute(
      Number(params.fspId),
      createFspAttributeDto,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Delete FSP attribute' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'FSP attribute deleted',
    type: FspQuestionEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No attribut with given name found for given fspId',
  })
  @ApiParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiParam({ name: 'attributeName', required: true, type: 'string' })
  @Delete(':fspId/attribute/:attributeName')
  public async deleteFspAttribute(@Param() params): Promise<FspQuestionEntity> {
    return await this.fspService.deleteFspAttribute(
      Number(params.fspId),
      params.attributeName,
    );
  }
}
