import {
  Controller,
  HttpCode,
  ParseArrayPipe,
  UseGuards,
} from '@nestjs/common';
import {
  Body,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { EXTERNAL_API } from '@121-service/src/config';
import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationPropertyResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-property-response.dto';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { UpdateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { UpdateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';
import { WrapperType } from '@121-service/src/wrapper.type';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/financial-service-provider-configurations')
@Controller('programs')
export class ProgramFinancialServiceProviderConfigurationsController {
  public constructor(
    private readonly programFinancialServiceProviderConfigurationsService: ProgramFinancialServiceProviderConfigurationsService,
  ) {}

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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist',
  })
  @Get(':programId/financial-service-provider-configurations')
  public async getByProgramId(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto[]> {
    return this.programFinancialServiceProviderConfigurationsService.getByProgramId(
      programId,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Create a Financial Service Provider Configuration for a Program. You can also add properties in this API call or you can add them later using /programs/{programId}/financial-service-provider-configurations/{name}/properties',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'The Financial Service Provider Configuration has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Program Financial Service Provider Configuration with same name already exists',
  })
  @Post(':programId/financial-service-provider-configurations')
  public async create(
    @Body()
    programFspConfigurationData: CreateProgramFinancialServiceProviderConfigurationDto,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto> {
    return await this.programFinancialServiceProviderConfigurationsService.create(
      programId,
      programFspConfigurationData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Update a Financial Service Provider Configuration for a Program. Can only update the label and properties. Posting an array with properties or an empty array of properties will delete all existing properties and create new ones. If you want to add properties it is therfore recommended to use this endpoint: /programs/{programId}/financial-service-provider-configurations/{name}/properties. Example of how to format properties can also be found there',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'name',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The Financial Service Provider Configuration has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @Patch(':programId/financial-service-provider-configurations/:name')
  public async update(
    @Body()
    programFspConfigurationData: UpdateProgramFinancialServiceProviderConfigurationDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto> {
    return await this.programFinancialServiceProviderConfigurationsService.update(
      programId,
      name,
      programFspConfigurationData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Delete a Financial Service Provider Configuration for a Program. Program Financial Service Provider Configurations cannot be deleted if they are associated with any transactions.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @HttpCode(204)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description:
      'The Financial Service Provider Configuration has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist or Financial Service Provider Configuration does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Program Financial Service Provider Configuration is associated with transactions, so cannot be deleted',
  })
  @Delete(':programId/financial-service-provider-configurations/:name')
  public async delete(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
  ): Promise<void> {
    await this.programFinancialServiceProviderConfigurationsService.delete(
      programId,
      name,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Create properties for a Program Financial Service Provider Configuration. See ${EXTERNAL_API.baseApiUrl}/financial-service-providers for allowed properties per financial service provider.`,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'name',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'The Financial Service Provider Configuration properties have been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist or Financial Service Provider Configuration does not exist',
  })
  @ApiBody({
    isArray: true,
    type: CreateProgramFinancialServiceProviderConfigurationPropertyDto,
  })
  @Post(':programId/financial-service-provider-configurations/:name/properties')
  public async createProperties(
    @Body(
      new ParseArrayPipe({
        items: CreateProgramFinancialServiceProviderConfigurationPropertyDto,
      }),
    )
    properties: CreateProgramFinancialServiceProviderConfigurationPropertyDto[],
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
  ): Promise<
    ProgramFinancialServiceProviderConfigurationPropertyResponseDto[]
  > {
    return await this.programFinancialServiceProviderConfigurationsService.createProperties(
      {
        programId,
        name,
        properties,
      },
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Update a single property for a Program Financial Service Provider Configuration.. See ${EXTERNAL_API.baseApiUrl}/financial-service-providers for allowed properties per financial service provider.`,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'name',
    required: true,
    type: 'string',
  })
  @ApiParam({
    name: 'propertyName',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'The Financial Service Provider Configuration property has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist or Financial Service Provider Configuration or propery does not exist',
  })
  @Patch(
    ':programId/financial-service-provider-configurations/:name/properties/:propertyName',
  )
  public async updateProperty(
    @Body()
    property: UpdateProgramFinancialServiceProviderConfigurationPropertyDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
    @Param('propertyName')
    propertyName: WrapperType<FspConfigurationProperties>,
  ): Promise<ProgramFinancialServiceProviderConfigurationPropertyResponseDto> {
    return await this.programFinancialServiceProviderConfigurationsService.updateProperty(
      {
        programId,
        name,
        propertyName,
        property,
      },
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Delete a single Program Financial Service Provider Configuration property. See ${EXTERNAL_API.baseApiUrl}/financial-service-providers for required properties per financial service provider.`,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'name',
    required: true,
    type: 'string',
  })
  @ApiParam({
    name: 'propertyName',
    required: true,
    type: 'string',
  })
  @HttpCode(204)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description:
      'The Financial Service Provider Configuration property is successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist or Financial Service Provider Configuration or propery does not exist',
  })
  @Delete(
    ':programId/financial-service-provider-configurations/:name/properties/:propertyName',
  )
  public async deleteProperty(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
    @Param('propertyName')
    propertyName: WrapperType<FspConfigurationProperties>,
  ): Promise<void> {
    await this.programFinancialServiceProviderConfigurationsService.deleteProperty(
      {
        programId,
        name,
        propertyName,
      },
    );
  }
}
