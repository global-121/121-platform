import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
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
import { Attribute } from '../registration/enum/custom-data-attributes';
import { SecretDto } from '../scripts/scripts.controller';
import { PermissionEnum } from '../user/permission.enum';
import { User } from '../user/user.decorator';
import { AdminAuthGuard } from './../guards/admin.guard';
import { ChangePhaseDto } from './dto/change-phase.dto';
import { CreateProgramCustomAttributesDto } from './dto/create-program-custom-attribute.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramQuestionDto } from './dto/update-program-question.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { ProgramQuestionEntity } from './program-question.entity';
import { ProgramEntity } from './program.entity';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
import { ProgramService } from './programs.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramController {
  private readonly programService: ProgramService;
  public constructor(programService: ProgramService) {
    this.programService = programService;
  }

  @ApiOperation({ summary: 'Get program by id' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({
    name: 'formatCreateProgramDto',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':programId')
  public async findOne(
    @Param() params,
    @Query() queryParams,
    @User('id') userId: number,
  ): Promise<ProgramEntity | CreateProgramDto> {
    const formatCreateProgramDto =
      queryParams.formatCreateProgramDto === 'true';
    if (formatCreateProgramDto) {
      return this.programService.getCreateProgramDto(params.programId);
    } else {
      return await this.programService.findOne(
        Number(params.programId),
        userId,
      );
    }
  }

  @ApiOperation({ summary: 'Get published programs' })
  @ApiResponse({ status: 200, description: 'Return all published programs.' })
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

  @Permissions(PermissionEnum.ProgramPhaseUPDATE)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/change-phase')
  public async changePhase(
    @Param() params,
    @Body() changePhaseData: ChangePhaseDto,
  ): Promise<SimpleProgramRO> {
    return this.programService.changePhase(
      Number(params.programId),
      changePhaseData.newPhase,
    );
  }

  @Permissions(PermissionEnum.ProgramUPDATE)
  @ApiOperation({ summary: 'Update program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/update')
  public async updateProgram(
    @Param() params,
    @Body() updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramEntity> {
    return await this.programService.updateProgram(
      Number(params.programId),
      updateProgramDto,
    );
  }

  @Permissions(PermissionEnum.ProgramQuestionUPDATE)
  @ApiOperation({ summary: 'Update program question' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/update/program-question')
  public async updateProgramQuestion(
    @Body() updateProgramQuestionDto: UpdateProgramQuestionDto,
    @Param() params,
  ): Promise<ProgramQuestionEntity> {
    return await this.programService.updateProgramQuestion(
      Number(params.programId),
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

  @Permissions(PermissionEnum.ProgramCustomAttributeUPDATE)
  @ApiOperation({ summary: 'Update program custom attributes' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/update/program-custom-attributes')
  public async updateProgramCustomAttributes(
    @Param() params,
    @Body() updateProgramCustomAttributes: CreateProgramCustomAttributesDto,
  ): Promise<ProgramCustomAttributeEntity[]> {
    return await this.programService.updateProgramCustomAttributes(
      Number(params.programId),
      updateProgramCustomAttributes,
    );
  }

  @ApiOperation({ summary: 'Get PA-table attributes for given program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'phase', required: false, type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Return PA-table attributes by program-id.',
  })
  @Get(':programId/pa-table-attributes/:phase')
  public async getPaTableAttributes(@Param() params): Promise<Attribute[]> {
    return await this.programService.getPaTableAttributes(
      Number(params.programId),
      params.phase,
    );
  }
}
