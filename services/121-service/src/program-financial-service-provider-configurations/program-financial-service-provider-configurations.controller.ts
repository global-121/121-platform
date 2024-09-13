import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-fsp-configuration.dto';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';
import {
  HttpStatus,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Patch,
  Delete,
  HttpException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProgramFinancialServiceProviderConfigurationMapper } from './mappers/program-financial-service-provider-configuration.mapper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramFinancialServiceProviderConfigurationsController {
  private readonly programFspConfigService: ProgramFinancialServiceProviderConfigurationsService;
  public constructor(
    programFinancialServiceProviderConfigurationsService: ProgramFinancialServiceProviderConfigurationsService,
  ) {
    this.programFspConfigService =
      programFinancialServiceProviderConfigurationsService;
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Get all Financial Service Provider Configurations for a Program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Return Financial Service Provider Configurations by Program Id.',
  })
  @Get(':programId/financial-service-provider-configurations')
  public async findByProgramId(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<CreateProgramFinancialServiceProviderConfigurationDto[]> {
    const fspConfigs =
      await this.programFspConfigService.findByProgramId(programId);

    if (!fspConfigs) {
      throw new HttpException(
        {
          errors: `No Financial Service Provider Configurations found for Program: ${programId}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return ProgramFinancialServiceProviderConfigurationMapper.mapEntitiesToDtos(
      fspConfigs,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Create a Financial Service Provider Configuration for a Program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 201,
    description:
      'The Financial Service Provider Configuration has been successfully created.',
  })
  // TODO: Why do we add BAD_REQUEST and FORBIDDEN responses here and not also in the above Get method?
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @Post(':programId/financial-service-provider-configurations')
  public async create(
    @Body()
    programFspConfigurationData: CreateProgramFinancialServiceProviderConfigurationDto,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<number> {
    // TODO: Implement the create method in the service
    // return await this.programFspConfigService.create(
    //   programId,
    //   programFspConfigurationData,
    // );
    return 0;
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Update a Financial Service Provider Configuration for a Program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programFinancialServiceProviderConfigrationName',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The Financial Service Provider Configuration has been successfully updated.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @Patch(
    ':programId/financial-service-provider-configurations/:programFinancialServiceProviderConfigurationName',
  )
  public async update(
    @Body() programFspConfigurationData: UpdateProgramFspConfigurationDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('programFinancialServiceProviderConfigurationName')
    programFinancialServiceProviderConfigurationName: string,
  ): Promise<number> {
    // TODO: Implement the update method in the service
    // return await this.programFspConfigService.update(
    //   programId,
    //   programFspConfigurationId,
    //   programFspConfigurationData,
    // );
    return 0;
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Delete a Financial Service Provider Configuration for a Program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programFinancialServiceProviderConfigurationName',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The Financial Service Provider Configuration has been successfully deleted.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  // TODO: Can we just short this to :programId/financial-service-provider-configurations/:name ?
  @Delete(
    ':programId/financial-service-provider-configurations/:programFinancialServiceProviderConfigurationName',
  )
  public async delete(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('programFinancialServiceProviderConfigurationName')
    programFinancialServiceProviderConfigurationName: number,
  ): Promise<void> {
    // TODO: Implement the update method in the service
    // return await this.programFspConfigService.delete(
    //   programId,
    //   programFspConfigurationId,
    // );
  }
}
