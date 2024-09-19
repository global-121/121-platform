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

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { KoboConnectService } from '@121-service/src/kobo-connect/kobo-connect.service';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import {
  ProgramRegistrationAttributeDto,
  UpdateProgramRegistrationAttributeDto,
} from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramReturnDto } from '@121-service/src/programs/dto/program-return.dto';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { Attribute } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SecretDto } from '@121-service/src/scripts/scripts.controller';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramController {
  public constructor(
    private readonly programService: ProgramService,
    private readonly programAttributesService: ProgramAttributesService,
    private readonly koboConnectService: KoboConnectService,
  ) {}

  // Note: protecting this endpoint because we assume in this branch the PA-app will be removed
  @AuthenticatedUser()
  @ApiOperation({ summary: 'Get program by id' })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  // TODO: REFACTOR: Can we make the GET response structure identical to POST body structure by default? Then this setting is not needed anymore.
  // TODO: REFACTOR: GET /api/programs/:programid with a response body that does not need authorization (i.e. without assigned aid workers) and GET /api/programs/:programid/assigned-aid-workers that requires authorization, see: https://stackoverflow.com/questions/51383267/rest-get-endpoints-returning-different-models-based-on-user-role
  @ApiQuery({
    name: 'formatProgramReturnDto',
    required: false,
    type: 'boolean',
    description:
      'Return in a format to be used as a body for `POST /api/programs`.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return program by id.',
  })
  @Get(':programId')
  public async findOne(
    @Param('programId', ParseIntPipe)
    programId: number,

    @Query('formatProgramReturnDto', new ParseBoolPipe({ optional: true }))
    formatProgramReturnDto: boolean,

    @Req() req,
  ) {
    const userId = req.user.id;
    if (formatProgramReturnDto) {
      return this.programService.getProgramReturnDto(programId, userId);
    } else {
      return await this.programService.findProgramOrThrow(programId, userId);
    }
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({
    summary: `Create a program.`,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The program has been successfully created.',
    type: ProgramEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
  })
  @ApiQuery({
    name: 'importFromKobo',
    required: false,
    type: 'boolean',
    description: `
Create a program from an import using the Kobo-Connect API.  \n

When set to \`true\`, you can overwrite any specified program-properties using the body.  \n
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
    type: CreateProgramDto,
    required: false,
  })
  @Post()
  public async create(
    @Body()
    programData: CreateProgramDto | Partial<CreateProgramDto>,

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

    @Req() req,
  ): Promise<ProgramEntity> {
    const userId = req.user.id;

    if (importFromKobo) {
      if (koboToken && koboAssetId)
        programData = await this.koboConnectService.create(
          koboToken,
          koboAssetId,
          programData,
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

    const errors = await validate(plainToClass(CreateProgramDto, programData));

    if (errors.length > 0) {
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    return this.programService.create(programData as CreateProgramDto, userId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Delete program and all related data. ONLY USE THIS IF YOU KNOW WHAT YOU ARE DOING!',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'The program has been successfully deleted.',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
  })
  @Delete(':programId')
  public async delete(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Body() body: SecretDto,
    @Res() res,
  ): Promise<void> {
    if (body.secret !== process.env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    await this.programService.deleteProgram(programId);
    return res
      .status(HttpStatus.ACCEPTED)
      .send('The program has been successfully deleted.');
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramUPDATE] })
  @ApiOperation({ summary: 'Update program' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Representation of updated program',
    type: ProgramReturnDto,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Patch(':programId')
  public async updateProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Body() updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramReturnDto> {
    return await this.programService.updateProgram(programId, updateProgramDto);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramUPDATE] })
  @ApiOperation({ summary: 'Create registration attribute' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/program-registration-attributes')
  public async createProgramQuestion(
    @Body() programRegistrationAttribute: ProgramRegistrationAttributeDto,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramRegistrationAttributeEntity | undefined> {
    // ##TODO: Return a dto in instead of entity
    return await this.programService.createProgramRegistrationAttribute(
      programId,
      programRegistrationAttribute,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramQuestionUPDATE] })
  @ApiOperation({ summary: 'Update program question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return program question',
    type: ProgramRegistrationAttributeEntity,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programRegistrationAttributeId',
    required: true,
    type: 'integer',
  })
  @Patch(':programId/registration-attributes/:programRegistrationAttributeId')
  public async updateProgramQuestion(
    @Body() updateProgramQuestionDto: UpdateProgramRegistrationAttributeDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('programRegistrationAttributeId', ParseIntPipe)
    programRegistrationAttributeId: number,
  ): Promise<ProgramRegistrationAttributeEntity> {
    return await this.programService.updateProgramRegistrationAttribute(
      programId,
      programRegistrationAttributeId,
      updateProgramQuestionDto,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramQuestionDELETE] })
  @ApiOperation({ summary: 'Delete program question AND related answers' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programRegistrationAttributeId',
    required: true,
    type: 'integer',
  })
  @Delete(':programId/program-questions/:programRegistrationAttributeId')
  public async deleteProgramQuestion(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('programRegistrationAttributeId', ParseIntPipe)
    programRegistrationAttributeId: number,
  ): Promise<ProgramRegistrationAttributeEntity> {
    return await this.programService.deleteProgramRegistrationAttribute(
      programId,
      programRegistrationAttributeId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationREAD] })
  @ApiOperation({ summary: 'Get attributes for given program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return attributes by program-id.',
  })
  @ApiQuery({
    name: 'filterShowInPeopleAffectedTable',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'includeProgramRegistrationAttributes',
    required: false,
    type: 'boolean',
  })
  @ApiQuery({
    name: 'includeTemplateDefaultAttributes',
    required: false,
    type: 'boolean',
  })
  @Get(':programId/attributes')
  public async getAttributes(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query(
      'includeProgramRegistrationAttributes',
      new ParseBoolPipe({ optional: true }),
    )
    includeProgramRegistrationAttributes: boolean,
    @Query(
      'includeTemplateDefaultAttributes',
      new ParseBoolPipe({ optional: true }),
    )
    includeTemplateDefaultAttributes: boolean,
    @Query(
      'filterShowInPeopleAffectedTable',
      new ParseBoolPipe({ optional: true }),
    )
    filterShowInPeopleAffectedTable: boolean,
    @Req() req: any,
  ): Promise<Attribute[]> {
    const userId = req.user.id;
    if (userId) {
      const hasPersonalReadAccess =
        await this.programService.hasPersonalReadAccess(
          Number(userId),
          programId,
        );
      if (!hasPersonalReadAccess) {
        // If a person does not have personal read permission we should
        // not show registration data columns in the portal
        return [];
      }
    }
    const attr = await this.programAttributesService.getAttributes(
      programId,
      includeProgramRegistrationAttributes,
      includeTemplateDefaultAttributes,
      filterShowInPeopleAffectedTable,
    );
    return attr;
  }

  // TODO: REFACTOR: This endpoint's return is not typed as a DTO, so it is not clear what the response structure is in Swagger UI. See guidelines.
  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('financial-service-providers/intersolve-visa')
  @ApiOperation({ summary: 'Get information about the funding wallet' })
  @Get(':programId/financial-service-providers/intersolve-visa/funding-wallet')
  public async getFundingWallet(
    @Param('programId', ParseIntPipe)
    programId: number,
  ) {
    return await this.programService.getFundingWallet(programId);
  }
}
