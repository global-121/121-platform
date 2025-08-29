import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

import { env } from '@121-service/src/env';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { KoboConnectService } from '@121-service/src/kobo-connect/kobo-connect.service';
import { ProjectAttributesService } from '@121-service/src/project-attributes/project-attributes.service';
import { CreateProjectDto } from '@121-service/src/projects/dto/create-project.dto';
import {
  ProjectRegistrationAttributeDto,
  UpdateProjectRegistrationAttributeDto,
} from '@121-service/src/projects/dto/project-registration-attribute.dto';
import { ProjectReturnDto } from '@121-service/src/projects/dto/project-return.dto';
import { UpdateProjectDto } from '@121-service/src/projects/dto/update-project.dto';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { ProjectService } from '@121-service/src/projects/projects.service';
import { Attribute } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SecretDto } from '@121-service/src/scripts/scripts.controller';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  public constructor(
    private readonly projectService: ProjectService,
    private readonly projectAttributesService: ProjectAttributesService,
    private readonly koboConnectService: KoboConnectService,
  ) {}

  // Note: protecting this endpoint because we assume in this branch the PA-app will be removed
  @AuthenticatedUser()
  @ApiOperation({ summary: 'Get project by id' })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: 'integer',
  })
  // TODO: REFACTOR: Can we make the GET response structure identical to POST body structure by default? Then this setting is not needed anymore.
  // TODO: REFACTOR: GET /api/projects/:projectid with a response body that does not need authorization (i.e. without assigned aid workers) and GET /api/projects/:projectid/assigned-aid-workers that requires authorization, see: https://stackoverflow.com/questions/51383267/rest-get-endpoints-returning-different-models-based-on-user-role
  @ApiQuery({
    name: 'formatProjectReturnDto',
    required: false,
    type: 'boolean',
    description:
      'Return in a format to be used as a body for `POST /api/projects`.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return project by id.',
  })
  @Get(':projectId')
  public async findOne(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Query('formatProjectReturnDto', new ParseBoolPipe({ optional: true }))
    formatProjectReturnDto: boolean,
    @Req() req: ScopedUserRequest,
  ) {
    const userId = RequestHelper.getUserId(req);

    if (formatProjectReturnDto) {
      return this.projectService.getProjectReturnDto(projectId, userId);
    } else {
      return await this.projectService.findProjectOrThrow(projectId, userId);
    }
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: `Create a project.`,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The project has been successfully created.',
    type: ProjectEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
  })
  @ApiQuery({
    name: 'importFromKobo',
    required: false,
    type: 'boolean',
    description: `
Create a project from an import using the Kobo-Connect API.  \n

When set to \`true\`, you can overwrite any specified project-properties using the body.  \n
You can also leave the body empty.`,
  })
  @ApiQuery({
    name: 'koboToken',
    required: false,
    type: 'string',
    description: 'A valid Kobo token (required when `importFromKobo=true`)',
  })
  @ApiQuery({
    name: 'koboAssetId',
    required: false,
    type: 'string',
    description: 'A valid Kobo asset-ID (required when `importFromKobo=true`)',
  })
  @ApiBody({
    type: CreateProjectDto,
    required: false,
  })
  @Post()
  public async create(
    @Body()
    projectData: CreateProjectDto | Partial<CreateProjectDto>,

    @Query(
      'importFromKobo',
      new ParseBoolPipe({
        optional: true,
      }),
    )
    importFromKobo: boolean,

    @Query('koboToken')
    koboToken: string,

    @Query('koboAssetId')
    koboAssetId: string,

    @Req() req: ScopedUserRequest,
  ): Promise<ProjectEntity> {
    const userId = RequestHelper.getUserId(req);

    if (importFromKobo) {
      if (koboToken && koboAssetId)
        projectData = await this.koboConnectService.create(
          koboToken,
          koboAssetId,
          projectData,
        );
      else {
        throw new HttpException(
          {
            message: `If 'importFromKobo' is true you need to provide a 'koboToken' and 'koboAssetId'`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const errors = await validate(plainToClass(CreateProjectDto, projectData));

    if (errors.length > 0) {
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    return this.projectService.create(projectData as CreateProjectDto, userId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Delete project and all related data. ONLY USE THIS IF YOU KNOW WHAT YOU ARE DOING!',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The project has been successfully deleted.',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: 'integer',
  })
  @Delete(':projectId')
  public async delete(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Body() body: SecretDto,
    @Res() res,
  ): Promise<void> {
    if (body.secret !== env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    await this.projectService.deleteProject(projectId);
    return res
      .status(HttpStatus.NO_CONTENT)
      .send('The project has been successfully deleted.');
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectUPDATE] })
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Representation of updated project',
    type: ProjectReturnDto,
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @Patch(':projectId')
  public async updateProject(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectReturnDto> {
    return await this.projectService.updateProject(projectId, updateProjectDto);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProjectUPDATE] })
  @ApiOperation({ summary: 'Create registration attribute' })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @Post(':projectId/registration-attributes')
  public async createProjectRegistrationAttribute(
    @Body() projectRegistrationAttribute: ProjectRegistrationAttributeDto,
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<ProjectRegistrationAttributeDto> {
    return await this.projectService.createProjectRegistrationAttribute({
      projectId,
      createProjectRegistrationAttributeDto: projectRegistrationAttribute,
    });
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProjectUPDATE],
  })
  @ApiOperation({ summary: 'Update project registration attribute' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return project registration attribute',
    type: ProjectRegistrationAttributeEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Providede project registration attribute name not found',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({
    name: 'projectRegistrationAttributeName',
    required: true,
    type: 'string',
  })
  @Patch(':projectId/registration-attributes/:projectRegistrationAttributeName')
  public async updateProjectRegistrationAttribute(
    @Body()
    updateProjectRegistrationAttributeDto: UpdateProjectRegistrationAttributeDto,
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('projectRegistrationAttributeName')
    projectRegistrationAttributeName: string,
  ): Promise<ProjectRegistrationAttributeEntity> {
    return await this.projectService.updateProjectRegistrationAttribute(
      projectId,
      projectRegistrationAttributeName,
      updateProjectRegistrationAttributeDto,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProjectUPDATE],
  })
  @ApiOperation({
    summary:
      'Delete Registration Attribute for a Project. Also deletes the data of this Attribute for the Registrations in this Project.',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({
    name: 'projectRegistrationAttributeId',
    required: true,
    type: 'integer',
  })
  @Delete(':projectId/registration-attributes/:projectRegistrationAttributeId')
  public async deleteProjectRegistrationAttribute(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('projectRegistrationAttributeId', ParseIntPipe)
    projectRegistrationAttributeId: number,
  ): Promise<ProjectRegistrationAttributeEntity> {
    return await this.projectService.deleteProjectRegistrationAttribute(
      projectId,
      projectRegistrationAttributeId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationREAD] })
  @ApiOperation({ summary: 'Get attributes for given project' })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return attributes by project-id.',
  })
  @ApiQuery({
    name: 'filterShowInRegistrationsTable',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'includeProjectRegistrationAttributes',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'includeTemplateDefaultAttributes',
    required: false,
    type: 'boolean',
  })
  @Get(':projectId/attributes')
  public async getAttributes(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Query(
      'includeProjectRegistrationAttributes',
      new ParseBoolPipe({ optional: true }),
    )
    includeProjectRegistrationAttributes: boolean,
    @Query(
      'includeTemplateDefaultAttributes',
      new ParseBoolPipe({ optional: true }),
    )
    includeTemplateDefaultAttributes: boolean,
    @Query(
      'filterShowInRegistrationsTable',
      new ParseBoolPipe({ optional: true }),
    )
    filterShowInRegistrationsTable: boolean,
    @Req() req: ScopedUserRequest,
  ): Promise<Attribute[]> {
    const userId = RequestHelper.getUserId(req);

    if (userId) {
      const hasPersonalReadAccess =
        await this.projectService.hasPersonalReadAccess(
          Number(userId),
          projectId,
        );
      if (!hasPersonalReadAccess) {
        // If a person does not have personal read permission we should
        // not show registration data columns in the portal
        return [];
      }
    }
    const attr = await this.projectAttributesService.getAttributes({
      projectId,
      includeProjectRegistrationAttributes,
      includeTemplateDefaultAttributes,
      filterShowInRegistrationsTable,
    });
    return attr;
  }

  // TODO: REFACTOR: This endpoint's return is not typed as a DTO, so it is not clear what the response structure is in Swagger UI. See guidelines.
  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('fsps/intersolve-visa')
  @ApiOperation({ summary: 'Get information about the funding wallet' })
  @Get(':projectId/fsps/intersolve-visa/funding-wallet')
  public async getFundingWallet(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ) {
    return await this.projectService.getFundingWallet(projectId);
  }
}
