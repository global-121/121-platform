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
import { FspConfigurationProperties } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationPropertyResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-property-response.dto';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';
import { WrapperType } from '@121-service/src/wrapper.type';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/fsp-configurations')
@Controller('programs')
export class ProgramFspConfigurationsController {
  public constructor(
    private readonly programFspConfigurationsService: ProgramFspConfigurationsService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Get all Fsp Configurations for a Program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return Fsp Configurations by Program Id.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist',
  })
  @Get(':programId/fsp-configurations')
  public async getByProgramId(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramFspConfigurationResponseDto[]> {
    return this.programFspConfigurationsService.getByProgramId(programId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Create a Fsp Configuration for a Program. You can also add properties in this API call or you can add them later using /programs/{programId}/fsp-configurations/{name}/properties',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The Fsp Configuration has been successfully created.',
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
    description: 'Program Fsp Configuration with same name already exists',
  })
  @Post(':programId/fsp-configurations')
  public async create(
    @Body()
    programFspConfigurationData: CreateProgramFspConfigurationDto,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramFspConfigurationResponseDto> {
    return await this.programFspConfigurationsService.create(
      programId,
      programFspConfigurationData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Update a Fsp Configuration for a Program. Can only update the label and properties. Posting an array with properties or an empty array of properties will delete all existing properties and create new ones. If you want to add properties it is therefore recommended to use this endpoint: /programs/{programId}/fsp-configurations/{name}/properties. Example of how to format properties can also be found there',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'name',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The Fsp Configuration has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @Patch(':programId/fsp-configurations/:name')
  public async update(
    @Body()
    programFspConfigurationData: UpdateProgramFspConfigurationDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
  ): Promise<ProgramFspConfigurationResponseDto> {
    return await this.programFspConfigurationsService.update(
      programId,
      name,
      programFspConfigurationData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Delete a Fsp Configuration for a Program. Program Fsp Configurations cannot be deleted if they are associated with any transactions.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @HttpCode(204)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The Fsp Configuration has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist or Fsp Configuration does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Program Fsp Configuration is associated with transactions, so cannot be deleted',
  })
  @Delete(':programId/fsp-configurations/:name')
  public async delete(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
  ): Promise<void> {
    await this.programFspConfigurationsService.delete(programId, name);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Retrieve visible properties for Fsp Configuration.',
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
      'The Fsp Configuration properties have been successfully retrieved.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist or Fsp Configuration does not exist',
  })
  @Get(':programId/fsp-configurations/:name/properties')
  public async getFspConfigurationProperties(
    @Param('programId') programId: number,
    @Param('name') name: string,
  ): Promise<ProgramFspConfigurationPropertyResponseDto[]> {
    return this.programFspConfigurationsService.getFspConfigurationProperties(
      programId,
      name,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Create properties for a Program FSP Configuration. See ${EXTERNAL_API.rootApi}/fsps for allowed properties per FSP.`,
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
      'The Fsp Configuration properties have been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist or Fsp Configuration does not exist',
  })
  @ApiBody({
    isArray: true,
    type: CreateProgramFspConfigurationPropertyDto,
  })
  @Post(':programId/fsp-configurations/:name/properties')
  public async createProperties(
    @Body(
      new ParseArrayPipe({
        items: CreateProgramFspConfigurationPropertyDto,
      }),
    )
    properties: CreateProgramFspConfigurationPropertyDto[],
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
  ): Promise<ProgramFspConfigurationPropertyResponseDto[]> {
    return await this.programFspConfigurationsService.createProperties({
      programId,
      name,
      properties,
    });
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Update a single property for a Program FSP Configuration.. See ${EXTERNAL_API.rootApi}/fsps for allowed properties per FSP.`,
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
      'The Fsp Configuration property has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist or Fsp Configuration or property does not exist',
  })
  @Patch(':programId/fsp-configurations/:name/properties/:propertyName')
  public async updateProperty(
    @Body()
    property: UpdateProgramFspConfigurationPropertyDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
    @Param('propertyName')
    propertyName: WrapperType<FspConfigurationProperties>,
  ): Promise<ProgramFspConfigurationPropertyResponseDto> {
    return await this.programFspConfigurationsService.updateProperty({
      programId,
      name,
      propertyName,
      property,
    });
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Delete a single Program FSP Configuration property. See ${EXTERNAL_API.rootApi}/fsps for required properties per FSP.`,
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
    description: 'The Fsp Configuration property is successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist or Fsp Configuration or property does not exist',
  })
  @Delete(':programId/fsp-configurations/:name/properties/:propertyName')
  public async deleteProperty(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('name')
    name: string,
    @Param('propertyName')
    propertyName: WrapperType<FspConfigurationProperties>,
  ): Promise<void> {
    await this.programFspConfigurationsService.deleteProperty({
      programId,
      name,
      propertyName,
    });
  }
}
