import { ProgramQuestionEntity } from './program-question.entity';
import {
  Get,
  Post,
  Body,
  Param,
  Controller,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ProgramService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramsRO, SimpleProgramRO } from './program.interface';

import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ProgramEntity } from './program.entity';
import { UpdateProgramQuestionDto } from './dto/update-program-question.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ChangePhaseDto } from './dto/change-phase.dto';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { PermissionsGuard } from '../permissions.guard';
import { Permissions } from '../permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';
import { CreateProgramCustomAttributesDto } from './dto/create-program-custom-attribute.dto';
import { Attribute } from '../registration/enum/custom-data-attributes';

@UseGuards(PermissionsGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramController {
  private readonly programService: ProgramService;
  public constructor(programService: ProgramService) {
    this.programService = programService;
  }

  @ApiOperation({ summary: 'Get program by id' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':programId')
  public async findOne(@Param() params): Promise<ProgramEntity> {
    return await this.programService.findOne(Number(params.programId));
  }

  @Permissions(PermissionEnum.ProgramAllREAD)
  @ApiOperation({ summary: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'Return all programs.' })
  @Get()
  public async findAll(): Promise<ProgramsRO> {
    return await this.programService.findAll();
  }

  @ApiOperation({ summary: 'Get published programs' })
  @ApiResponse({ status: 200, description: 'Return all published programs.' })
  @Get('published/all')
  public async getPublishedPrograms(): Promise<ProgramsRO> {
    return await this.programService.getPublishedPrograms();
  }

  @Permissions(PermissionEnum.ProgramCREATE)
  @ApiOperation({ summary: 'Create program' })
  @ApiResponse({
    status: 201,
    description: 'The program has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post()
  public async create(
    @Body() programData: CreateProgramDto,
  ): Promise<ProgramEntity> {
    return this.programService.create(programData);
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
  ): Promise<ProgramQuestionEntity> {
    return await this.programService.updateProgramQuestion(
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
