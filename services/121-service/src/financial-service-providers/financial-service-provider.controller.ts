import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../guards/authenticated-user.guard';
import {
  CreateFspAttributeDto,
  UpdateFinancialServiceProviderDto,
  UpdateFspAttributeDto,
} from './dto/update-financial-service-provider.dto';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FinancialServiceProvidersService } from './financial-service-provider.service';
import { FspQuestionEntity } from './fsp-question.entity';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers')
@Controller('financial-service-providers')
export class FinancialServiceProvidersController {
  public constructor(
    private readonly fspService: FinancialServiceProvidersService,
  ) {}

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
    @Param('fspId', ParseIntPipe)
    fspId: number,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.getFspById(fspId);
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
    @Param('fspId', ParseIntPipe)
    fspId: number,
    @Body() updateFspDto: UpdateFinancialServiceProviderDto,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.updateFsp(fspId, updateFspDto);
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
    @Param('fspId', ParseIntPipe)
    fspId: number,
    @Body() updateFspAttributeDto: UpdateFspAttributeDto,
  ): Promise<FspQuestionEntity> {
    return await this.fspService.updateFspAttribute(
      fspId,
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
    @Param('fspId', ParseIntPipe)
    fspId: number,
    @Body() createFspAttributeDto: CreateFspAttributeDto,
  ): Promise<FspQuestionEntity> {
    return await this.fspService.createFspAttribute(
      fspId,
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
  public async deleteFspAttribute(
    @Param() params,
    @Param('fspId', ParseIntPipe)
    fspId: number,
  ): Promise<FspQuestionEntity> {
    return await this.fspService.deleteFspAttribute(
      fspId,
      params.attributeName,
    );
  }
}
