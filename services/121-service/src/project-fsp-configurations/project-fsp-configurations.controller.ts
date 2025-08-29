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
import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { CreateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration-property.dto';
import { ProjectFspConfigurationPropertyResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-property-response.dto';
import { ProjectFspConfigurationResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-response.dto';
import { UpdateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration.dto';
import { UpdateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration-property.dto';
import { ProjectFspConfigurationsService } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.service';
import { WrapperType } from '@121-service/src/wrapper.type';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('projects/fsp-configurations')
@Controller('projects')
export class ProjectFspConfigurationsController {
  public constructor(
    private readonly projectFspConfigurationsService: ProjectFspConfigurationsService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Get all Fsp Configurations for a Project.',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return Fsp Configurations by Project Id.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project does not exist',
  })
  @Get(':projectId/fsp-configurations')
  public async getByProjectId(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<ProjectFspConfigurationResponseDto[]> {
    return this.projectFspConfigurationsService.getByProjectId(projectId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Create a Fsp Configuration for a Project. You can also add properties in this API call or you can add them later using /projects/{projectId}/fsp-configurations/{name}/properties',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The Fsp Configuration has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Project Fsp Configuration with same name already exists',
  })
  @Post(':projectId/fsp-configurations')
  public async create(
    @Body()
    projectFspConfigurationData: CreateProjectFspConfigurationDto,
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<ProjectFspConfigurationResponseDto> {
    return await this.projectFspConfigurationsService.create(
      projectId,
      projectFspConfigurationData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Update a Fsp Configuration for a Project. Can only update the label and properties. Posting an array with properties or an empty array of properties will delete all existing properties and create new ones. If you want to add properties it is therfore recommended to use this endpoint: /projects/{projectId}/fsp-configurations/{name}/properties. Example of how to format properties can also be found there',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
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
    description: 'Project does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @Patch(':projectId/fsp-configurations/:name')
  public async update(
    @Body()
    projectFspConfigurationData: UpdateProjectFspConfigurationDto,
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('name')
    name: string,
  ): Promise<ProjectFspConfigurationResponseDto> {
    return await this.projectFspConfigurationsService.update(
      projectId,
      name,
      projectFspConfigurationData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Delete a Fsp Configuration for a Project. Project Fsp Configurations cannot be deleted if they are associated with any transactions.',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @HttpCode(204)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The Fsp Configuration has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project does not exist or Fsp Configuration does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Project Fsp Configuration is associated with transactions, so cannot be deleted',
  })
  @Delete(':projectId/fsp-configurations/:name')
  public async delete(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('name')
    name: string,
  ): Promise<void> {
    await this.projectFspConfigurationsService.delete(projectId, name);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Retrieve visible properties for Fsp Configuration.',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
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
    description: 'Project does not exist or Fsp Configuration does not exist',
  })
  @Get(':projectId/fsp-configurations/:name/properties')
  public async getFspConfigurationProperties(
    @Param('projectId') projectId: number,
    @Param('name') name: string,
  ): Promise<ProjectFspConfigurationPropertyResponseDto[]> {
    return this.projectFspConfigurationsService.getFspConfigurationProperties(
      projectId,
      name,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Create properties for a Project FSP Configuration. See ${EXTERNAL_API.rootApi}/fsps for allowed properties per FSP.`,
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
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
    description: 'Project does not exist or Fsp Configuration does not exist',
  })
  @ApiBody({
    isArray: true,
    type: CreateProjectFspConfigurationPropertyDto,
  })
  @Post(':projectId/fsp-configurations/:name/properties')
  public async createProperties(
    @Body(
      new ParseArrayPipe({
        items: CreateProjectFspConfigurationPropertyDto,
      }),
    )
    properties: CreateProjectFspConfigurationPropertyDto[],
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('name')
    name: string,
  ): Promise<ProjectFspConfigurationPropertyResponseDto[]> {
    return await this.projectFspConfigurationsService.createProperties({
      projectId,
      name,
      properties,
    });
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Update a single property for a Project FSP Configuration.. See ${EXTERNAL_API.rootApi}/fsps for allowed properties per FSP.`,
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
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
      'Project does not exist or Fsp Configuration or propery does not exist',
  })
  @Patch(':projectId/fsp-configurations/:name/properties/:propertyName')
  public async updateProperty(
    @Body()
    property: UpdateProjectFspConfigurationPropertyDto,
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('name')
    name: string,
    @Param('propertyName')
    propertyName: WrapperType<FspConfigurationProperties>,
  ): Promise<ProjectFspConfigurationPropertyResponseDto> {
    return await this.projectFspConfigurationsService.updateProperty({
      projectId,
      name,
      propertyName,
      property,
    });
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Delete a single Project FSP Configuration property. See ${EXTERNAL_API.rootApi}/fsps for required properties per FSP.`,
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
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
      'Project does not exist or Fsp Configuration or propery does not exist',
  })
  @Delete(':projectId/fsp-configurations/:name/properties/:propertyName')
  public async deleteProperty(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('name')
    name: string,
    @Param('propertyName')
    propertyName: WrapperType<FspConfigurationProperties>,
  ): Promise<void> {
    await this.projectFspConfigurationsService.deleteProperty({
      projectId,
      name,
      propertyName,
    });
  }
}
