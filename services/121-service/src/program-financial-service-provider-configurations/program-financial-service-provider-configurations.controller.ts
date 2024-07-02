import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';
import { CreateProgramFspConfigurationDto } from '@121-service/src/programs/dto/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/programs/dto/update-program-fsp-configuration.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramFspConfigurationController {
  private readonly programFspConfigurationService: ProgramFinancialServiceProviderConfigurationsService;
  public constructor(
    programFspConfigurationService: ProgramFinancialServiceProviderConfigurationsService,
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
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramFinancialServiceProviderConfigurationEntity[]> {
    return this.programFspConfigurationService.findByProgramId(programId);
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
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<number> {
    return await this.programFspConfigurationService.create(
      programId,
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
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('programFspConfigurationId', ParseIntPipe)
    programFspConfigurationId: number,
  ): Promise<number> {
    return await this.programFspConfigurationService.update(
      programId,
      programFspConfigurationId,
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
  public async delete(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('programFspConfigurationId', ParseIntPipe)
    programFspConfigurationId: number,
  ): Promise<void> {
    return await this.programFspConfigurationService.delete(
      programId,
      programFspConfigurationId,
    );
  }
}
