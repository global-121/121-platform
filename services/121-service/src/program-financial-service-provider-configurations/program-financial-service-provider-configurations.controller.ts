import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-fsp-configuration.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';
import {
  UseGuards,
  Controller,
  HttpStatus,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Put,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

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
  ): Promise<ProgramFinancialServiceProviderConfigurationEntity[]> {
    const fspConfigs =
      await this.programFspConfigService.findByProgramId(programId);

    // TODO: Map the response to a DTO. Should we loop through all entities and call the mapper function, or add/change the mapper function to accept an array of entities?
    if (!fspConfigs) {
      // TODO: Return a Not Found response (404)
      //throw HttpStatus.NOT_FOUND;
      throw new Error('No FSP Configurations found for this Program.');
    }

    return fspConfigs;
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
    @Body() programFspConfigurationData: CreateProgramFspConfigurationDto,
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
