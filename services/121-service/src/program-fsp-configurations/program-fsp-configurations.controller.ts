import {
  Controller,
  HttpCode,
  ParseArrayPipe,
  Put,
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

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationPropertyResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-property-response.dto';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/fsp-configurations')
@Controller('programs')
export class ProgramFspConfigurationsController {
  public constructor(
    private readonly programFspConfigurationsService: ProgramFspConfigurationsService,
  ) {}

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramFspConfigREAD],
  })
  @ApiOperation({
    summary: 'Get all FSP-configurations for a Program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all FSP-configurations for the given Program Id.',
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

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramFspConfigCREATE],
  })
  @ApiOperation({
    summary: `
      Create an FSP-configuration for a Program.
      You can add properties in this API call or add them later using: \`/api/programs/{programId}/fsp-configurations/{name}/properties\`
      `,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'FSP-configuration has been successfully created.',
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
    description: 'FSP-configuration with the same name already exists',
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

  @AuthenticatedUser({
    permissions: [
      PermissionEnum.ProgramFspConfigCREATE, 
      PermissionEnum.ProgramFspConfigUPDATE,
      PermissionEnum.ProgramFspConfigDELETE
    ],
  })
  @ApiOperation({
    summary:
      'Update available program FSPs based on a list of FSP names.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Available program FSPs have been successfully updated.',
  })
  @Put(':programId/fsp-configurations/fsps')
  public async updateAvailableFspsForProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Body('fsps', new ParseArrayPipe({ items: String }))
    fsps: Fsps[],
  ): Promise<void> {
    await this.programFspConfigurationsService.updateAvailableFspsForProgram(
      {
        programId,
        fsps,
      },
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramFspConfigUPDATE],
  })
  @ApiOperation({
    summary: `
      Update an FSP-configuration for a Program. Can only update the label and properties.
      Posting any (empty) array with properties will delete all _existing_ properties and create _new_ ones.
      If you only want to _add_ properties it is therefore recommended to use the endpoint: \`/api/programs/{programId}/fsp-configurations/{name}/properties\`.
      Example of how to format properties can also be found there.
      `,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'name',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'FSP-configuration has been successfully updated.',
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

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramFspConfigDELETE],
  })
  @ApiOperation({
    summary:
      'Delete an FSP-configuration. FSP-configurations cannot be deleted if they are associated with any transaction(s).',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @HttpCode(204)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'FSP-configuration has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program or FSP-configuration does not exist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'FSP-configuration is associated with transaction(s), so cannot be deleted',
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

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramFspConfigREAD],
  })
  @ApiOperation({
    summary: 'Retrieve visible properties for FSP-configuration.',
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
      'FSP-configuration properties have been successfully retrieved.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program or FSP-configuration does not exist',
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

  @AuthenticatedUser({
    permissions: [
      PermissionEnum.ProgramREAD,
      PermissionEnum.ProgramFspConfigREAD,
    ],
  })
  @ApiOperation({
    summary:
      'Retrieve allowlisted public properties for FSP-configuration. Only returns properties that are safe to expose to non-admin users based on the Program FSP-configuration Property type.',
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
      'FSP-configuration properties have been successfully retrieved.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program or FSP-configuration does not exist',
  })
  @Get(':programId/fsp-configurations/:name/properties/public')
  public async getPublicFspConfigurationProperties(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('name') name: string,
  ): Promise<ProgramFspConfigurationPropertyResponseDto[]> {
    return this.programFspConfigurationsService.getPublicFspConfigurationProperties(
      programId,
      name,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramFspConfigUPDATE] })
  @ApiOperation({
    summary: `Create properties for an FSP-configuration. See \`/api/fsps\` for allowed properties per FSP.`,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'name',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'FSP-configuration properties have been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program or FSP-configuration does not exist',
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

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramFspConfigUPDATE] })
  @ApiOperation({
    summary: `Update a single property for an FSP-configuration. See \`/api/fsps\` for allowed properties per FSP.`,
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
    description: 'FSP-configuration property has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program, FSP-configuration or property does not exist',
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

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramFspConfigDELETE] })
  @ApiOperation({
    summary: `Delete a single FSP-configuration property. See \`/api/fsps\` for required properties per FSP.`,
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
    description: 'FSP-configuration property is successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request. Body or params are malformed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program, FSP-configuration or property does not exist',
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
