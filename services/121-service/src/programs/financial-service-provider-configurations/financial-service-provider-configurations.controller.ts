import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from '../../guards/admin.decorator';
import { CreateProgramFspConfigurationDto } from '../dto/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '../dto/update-program-fsp-configuration.dto';
import { AdminAuthGuard } from '../../guards/admin.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { ProgramFinancialServiceProviderConfigurationsService } from './financial-service-provider-configurations.service';
import { ProgramFinancialServiceProviderConfigurationEntity } from './program-financial-service-provider-configuration.entity';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramFinancialServiceProviderConfigurationsController {
  private readonly programFspConfigurationService: ProgramFinancialServiceProviderConfigurationsService;
  public constructor(
    programFspConfigurationService: ProgramFinancialServiceProviderConfigurationsService,
  ) {
    this.programFspConfigurationService = programFspConfigurationService;
  }

  @Admin()
  @ApiOperation({
    summary: 'Get all programFspConfigurationEntity for a specific program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Return programFspConfigurationEntity by program id.',
  })
  @Get(':programId/fsp-configuration')
  public async findByProgramId(
    @Param() params,
  ): Promise<ProgramFinancialServiceProviderConfigurationEntity[]> {
    if (isNaN(params.programId)) {
      throw new HttpException(
        'Program ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.programFspConfigurationService.findByProgramId(
      params.programId,
    );
  }

  @Admin()
  @ApiOperation({
    summary: 'Create ProgramFspConfigurationEntity for a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 201,
    description:
      'The programFspConfigurationEntity has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post(':programId/fsp-configuration')
  public async create(
    @Body() programFspConfigurationData: CreateProgramFspConfigurationDto,
    @Param() params,
  ): Promise<number> {
    if (isNaN(params.programId)) {
      throw new HttpException(
        'Program ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.programFspConfigurationService.create(
      params.programId,
      programFspConfigurationData,
    );
  }

  @Admin()
  @ApiOperation({ summary: 'Update ProgramFspConfigurationEntity' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programFspConfigurationId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description:
      'The programFspConfigurationEntity has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Put(':programId/fsp-configuration/:programFspConfigurationId')
  public async update(
    @Body() programFspConfigurationData: UpdateProgramFspConfigurationDto,
    @Param() params,
  ): Promise<number> {
    if (isNaN(params.programId) || isNaN(params.programFspConfigurationId)) {
      throw new HttpException(
        'Program ID or FSP configuration ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.programFspConfigurationService.update(
      params.programId,
      params.programFspConfigurationId,
      programFspConfigurationData,
    );
  }

  @Admin()
  @ApiOperation({ summary: 'Update ProgramFspConfigurationEntity' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programFspConfigurationId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description:
      'The programFspConfigurationEntity has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Delete(':programId/fsp-configuration/:programFspConfigurationId')
  public async delete(@Param() params): Promise<void> {
    if (isNaN(params.programId) || isNaN(params.programFspConfigurationId)) {
      throw new HttpException(
        'Program ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.programFspConfigurationService.delete(
      params.programId,
      params.programFspConfigurationId,
    );
  }
}
