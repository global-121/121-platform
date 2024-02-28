import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Admin } from '../guards/admin.decorator';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { ProgramAttributesService } from '../program-attributes/program-attributes.service';
import { Attribute } from '../registration/enum/custom-data-attributes';
import { SecretDto } from '../scripts/scripts.controller';
import { PermissionEnum } from '../user/enum/permission.enum';
import { User } from '../user/user.decorator';
import { AdminAuthGuard } from './../guards/admin.guard';
import { CreateProgramCustomAttributeDto } from './dto/create-program-custom-attribute.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import {
  CreateProgramQuestionDto,
  UpdateProgramQuestionDto,
} from './dto/program-question.dto';
import { ProgramReturnDto } from './dto/program-return.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { ProgramQuestionEntity } from './program-question.entity';
import { ProgramEntity } from './program.entity';
import { ProgramsRO } from './program.interface';
import { ProgramService } from './programs.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramController {
  public constructor(
    private readonly programService: ProgramService,
    private readonly programAttributesService: ProgramAttributesService,
  ) {}

  @ApiOperation({ summary: 'Get program by id' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  // TODO: REFACTOR: Can we make the GET response structure identical to POST body structure by default? Then this setting is not needed anymore.
  // TODO: REFACTOR: GET /api/programs/:programid with a response body that does not need authorization (i.e. without assigned aid workers) and GET /api/programs/:programid/assigned-aid-workers that requires authorization, see: https://stackoverflow.com/questions/51383267/rest-get-endpoints-returning-different-models-based-on-user-role
  @ApiQuery({
    name: 'formatProgramReturnDto',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':programId')
  public async findOne(
    @Param() params,
    @Query() queryParams,
    @User('id') userId: number,
  ): Promise<ProgramEntity | ProgramReturnDto> {
    const formatCreateProgramDto =
      queryParams.formatCreateProgramDto === 'true';
    if (formatCreateProgramDto) {
      return this.programService.getProgramReturnDto(params.programId, userId);
    } else {
      return await this.programService.findProgramOrThrow(
        Number(params.programId),
        userId,
      );
    }
  }

  @ApiOperation({ summary: 'Get published programs' })
  @ApiResponse({ status: 200, description: 'Return all published programs.' })
  // TODO: REFACTOR: into GET /api/programs?published=true
  @Get('published/all')
  public async getPublishedPrograms(): Promise<ProgramsRO> {
    return await this.programService.getPublishedPrograms();
  }

  @ApiOperation({ summary: 'Get all assigned programs for a user' })
  @ApiResponse({
    status: 200,
    description: 'Return all assigned programs for a user.',
  })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  // TODO: REFACTOR: into GET /api/users/:userid/programs
  @Get('assigned/all')
  public async getAssignedPrograms(
    @User('id') userId: number,
  ): Promise<ProgramsRO> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return await this.programService.getAssignedPrograms(userId);
  }

  @Admin()
  @ApiOperation({ summary: 'Create program' })
  @ApiResponse({
    status: 201,
    description: 'The program has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post()
  public async create(
    @Body() programData: CreateProgramDto,
    @User('id') userId: number,
  ): Promise<ProgramEntity> {
    return this.programService.create(programData, userId);
  }

  @Admin()
  @ApiOperation({
    summary:
      'Delete program and all related data. ONLY USE THIS IF YOU KNOW WHAT YOU ARE DOING!',
  })
  @ApiResponse({
    status: 202,
    description: 'The program has been successfully deleted.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Delete(':programId')
  public async delete(
    @Param() param,
    @Body() body: SecretDto,
    @Res() res,
  ): Promise<void> {
    if (body.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    await this.programService.deleteProgram(param.programId);
    return res
      .status(HttpStatus.ACCEPTED)
      .send('The program has been successfully deleted.');
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({ summary: 'Update program' })
  @ApiResponse({
    status: 200,
    description: 'Representation of updated program',
    type: ProgramReturnDto,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Patch(':programId')
  public async updateProgram(
    @Param() params,
    @Body() updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramReturnDto> {
    return await this.programService.updateProgram(
      Number(params.programId),
      updateProgramDto,
    );
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({ summary: 'Create program question' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/program-questions')
  public async createProgramQuestion(
    @Body() updateProgramQuestionDto: CreateProgramQuestionDto,
    @Param() params,
  ): Promise<ProgramQuestionEntity> {
    return await this.programService.createProgramQuestion(
      Number(params.programId),
      updateProgramQuestionDto,
    );
  }

  @Permissions(PermissionEnum.ProgramQuestionUPDATE)
  @ApiOperation({ summary: 'Update program question' })
  @ApiResponse({
    status: 200,
    description: 'Return program question',
    type: ProgramQuestionEntity,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'programQuestionId', required: true, type: 'integer' })
  @Patch(':programId/program-questions/:programQuestionId')
  public async updateProgramQuestion(
    @Body() updateProgramQuestionDto: UpdateProgramQuestionDto,
    @Param() params,
  ): Promise<ProgramQuestionEntity> {
    return await this.programService.updateProgramQuestion(
      Number(params.programId),
      Number(params.programQuestionId),
      updateProgramQuestionDto,
    );
  }

  @Permissions(PermissionEnum.ProgramQuestionDELETE)
  @ApiOperation({ summary: 'Delete program question AND related answers' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programQuestionId',
    required: true,
    type: 'integer',
  })
  @Delete(':programId/program-questions/:programQuestionId')
  public async deleteProgramQuestion(
    @Param() params: any,
  ): Promise<ProgramQuestionEntity> {
    return await this.programService.deleteProgramQuestion(
      params.programId,
      params.programQuestionId,
    );
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({ summary: 'Create program custom attribute' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/custom-attributes')
  public async createProgramCustomAttribute(
    @Body() createProgramQuestionDto: CreateProgramCustomAttributeDto,
    @Param() params,
  ): Promise<ProgramCustomAttributeEntity> {
    return await this.programService.createProgramCustomAttribute(
      Number(params.programId),
      createProgramQuestionDto,
    );
  }

  @Permissions(PermissionEnum.ProgramCustomAttributeUPDATE)
  @ApiOperation({ summary: 'Update program custom attributes' })
  @ApiResponse({
    status: 200,
    description: 'Return program custom attributes',
    type: ProgramCustomAttributeEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'No attribute found for given program and custom attribute id',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'customAttributeId', required: true, type: 'integer' })
  @Patch(':programId/custom-attributes/:customAttributeId')
  public async updateProgramCustomAttributes(
    @Param() params,
    @Body() createProgramCustomAttributeDto: CreateProgramCustomAttributeDto,
  ): Promise<ProgramCustomAttributeEntity> {
    return await this.programService.updateProgramCustomAttributes(
      Number(params.programId),
      Number(params.customAttributeId),
      createProgramCustomAttributeDto,
    );
  }

  @ApiOperation({ summary: 'Get attributes for given program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Return attributes by program-id.',
  })
  @ApiQuery({
    name: 'phase',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'includeProgramQuestions',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'includeCustomAttributes',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'includeFspQuestions',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'includeTemplateDefaultAttributes',
    required: false,
    type: 'boolean',
  })
  @Permissions(PermissionEnum.RegistrationREAD)
  @Get(':programId/attributes')
  public async getAttributes(
    @Param() params,
    @Query() queryParams,
    @User('id') userId: number,
  ): Promise<Attribute[]> {
    if (userId) {
      const hasPersonalReadAccess =
        await this.programService.hasPersonalReadAccess(
          Number(userId),
          Number(params.programId),
        );
      if (!hasPersonalReadAccess) {
        // If a person does not have personal read permission we should
        // not show registration data columns in the portal
        return [];
      }
    }

    return await this.programAttributesService.getAttributes(
      Number(params.programId),
      queryParams.includeCustomAttributes === 'true',
      queryParams.includeProgramQuestions === 'true',
      queryParams.includeFspQuestions === 'true',
      queryParams.includeTemplateDefaultAttributes === 'true',
      queryParams.phase,
    );
  }
}
