import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../../guards/authenticated-user.guard';
import { CreateProgramFspConfigurationDto } from '../dto/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '../dto/update-program-fsp-configuration.dto';
import { ProgramFspConfigurationService } from './fsp-configuration.service';
import { ProgramFspConfigurationEntity } from './program-fsp-configuration.entity';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramFspConfigurationController {
  private readonly programFspConfigurationService: ProgramFspConfigurationService;
  public constructor(
    programFspConfigurationService: ProgramFspConfigurationService,
  ) {
    this.programFspConfigurationService = programFspConfigurationService;
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Get all programFspConfigurationEntity for a specific program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return programFspConfigurationEntity by program id.',
  })
  @Get(':programId/fsp-configuration')
  public async findByProgramId(
    @Param() params,
  ): Promise<ProgramFspConfigurationEntity[]> {
    if (isNaN(params.programId)) {
      throw new HttpException(
        'Program ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.programFspConfigurationService.findByProgramId(
      params.programId,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Create ProgramFspConfigurationEntity for a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 201,
    description:
      'The programFspConfigurationEntity has been successfully created.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @Post(':programId/fsp-configuration')
  public async create(
    @Body() programFspConfigurationData: CreateProgramFspConfigurationDto,
    @Param() params,
  ): Promise<number> {
    if (isNaN(params.programId)) {
      throw new HttpException(
        'Program ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.programFspConfigurationService.create(
      params.programId,
      programFspConfigurationData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Update ProgramFspConfigurationEntity' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programFspConfigurationId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The programFspConfigurationEntity has been successfully updated.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @Put(':programId/fsp-configuration/:programFspConfigurationId')
  public async update(
    @Body() programFspConfigurationData: UpdateProgramFspConfigurationDto,
    @Param() params,
  ): Promise<number> {
    if (isNaN(params.programId) || isNaN(params.programFspConfigurationId)) {
      throw new HttpException(
        'Program ID or FSP configuration ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.programFspConfigurationService.update(
      params.programId,
      params.programFspConfigurationId,
      programFspConfigurationData,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Update ProgramFspConfigurationEntity' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programFspConfigurationId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The programFspConfigurationEntity has been successfully updated.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @Delete(':programId/fsp-configuration/:programFspConfigurationId')
  public async delete(@Param() params): Promise<void> {
    if (isNaN(params.programId) || isNaN(params.programFspConfigurationId)) {
      throw new HttpException(
        'Program ID is not a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.programFspConfigurationService.delete(
      params.programId,
      params.programFspConfigurationId,
    );
  }
}
