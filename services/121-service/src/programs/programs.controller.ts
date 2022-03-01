import { ProgramQuestionEntity } from './program-question.entity';
import { Get, Post, Body, Param, Controller, UseGuards } from '@nestjs/common';
import { ProgramService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramsRO, SimpleProgramRO } from './program.interface';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
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

@UseGuards(PermissionsGuard)
@ApiUseTags('programs')
@Controller('programs')
export class ProgramController {
  private readonly programService: ProgramService;
  public constructor(programService: ProgramService) {
    this.programService = programService;
  }

  @ApiOperation({ title: 'Get program by id' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':programId')
  public async findOne(@Param() params): Promise<ProgramEntity> {
    return await this.programService.findOne(Number(params.programId));
  }

  @Permissions(PermissionEnum.ProgramAllREAD)
  @ApiOperation({ title: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'Return all programs.' })
  @Get()
  public async findAll(): Promise<ProgramsRO> {
    return await this.programService.findAll();
  }

  @ApiOperation({ title: 'Get published programs' })
  @ApiResponse({ status: 200, description: 'Return all published programs.' })
  @Get('published/all')
  public async getPublishedPrograms(): Promise<ProgramsRO> {
    return await this.programService.getPublishedPrograms();
  }

  @Permissions(PermissionEnum.ProgramCREATE)
  @ApiOperation({ title: 'Create program' })
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
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('change-phase/:programId')
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
  @ApiOperation({ title: 'Update program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
  @ApiOperation({ title: 'Update program question' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/update/program-question')
  public async updateProgramQuestion(
    @Body() updateProgramQuestionDto: UpdateProgramQuestionDto,
  ): Promise<ProgramQuestionEntity> {
    return await this.programService.updateProgramQuestion(
      updateProgramQuestionDto,
    );
  }

  @Permissions(PermissionEnum.ProgramCustomAttributeUPDATE)
  @ApiOperation({ title: 'Update program custom attributes' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
}
