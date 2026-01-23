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
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import {
  ProgramRegistrationAttributeDto,
  UpdateProgramRegistrationAttributeDto,
} from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramReturnDto } from '@121-service/src/programs/dto/program-return.dto';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { Attribute } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SecretDto } from '@121-service/src/scripts/scripts.controller';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
@Controller('programs')
export class ProgramController {
  public constructor(
    private readonly programService: ProgramService,
    private readonly programAttributesService: ProgramAttributesService,
    private readonly koboConnectService: KoboConnectService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramREAD] })
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
    @Req() req: ScopedUserRequest,
  ) {
    const userId = RequestHelper.getUserId(req);

    if (formatProgramReturnDto) {
      return this.programService.getProgramReturnDto(programId, userId);
    } else {
      return await this.programService.findProgramOrThrow(programId, userId);
    }
  }

  @AuthenticatedUser({ isAdmin: true })
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
    programData: Partial<CreateProgramDto>,

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
  ): Promise<ProgramEntity> {
    const userId = RequestHelper.getUserId(req);

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
    status: HttpStatus.NO_CONTENT,
    description: 'The program has been successfully deleted.',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @Delete(':programId')
  public async delete(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Body() body: SecretDto,
    @Res() res,
  ): Promise<void> {
    if (body.secret !== env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    await this.programService.deleteProgram(programId);
    return res
      .status(HttpStatus.NO_CONTENT)
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
  @Post(':programId/registration-attributes')
  public async createProgramRegistrationAttribute(
    @Body() programRegistrationAttribute: ProgramRegistrationAttributeDto,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramRegistrationAttributeDto> {
    return await this.programService.createProgramRegistrationAttribute({
      programId,
      createProgramRegistrationAttributeDto: programRegistrationAttribute,
    });
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramUPDATE],
  })
  @ApiOperation({ summary: 'Update program registration attribute' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return program registration attribute',
    type: ProgramRegistrationAttributeEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provided program registration attribute name not found',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programRegistrationAttributeName',
    required: true,
    type: 'string',
  })
  @Patch(':programId/registration-attributes/:programRegistrationAttributeName')
  public async updateProgramRegistrationAttribute(
    @Body()
    updateProgramRegistrationAttributeDto: UpdateProgramRegistrationAttributeDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('programRegistrationAttributeName')
    programRegistrationAttributeName: string,
  ): Promise<ProgramRegistrationAttributeEntity> {
    return await this.programService.updateProgramRegistrationAttribute(
      programId,
      programRegistrationAttributeName,
      updateProgramRegistrationAttributeDto,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramUPDATE],
  })
  @ApiOperation({
    summary:
      'Delete Registration Attribute for a Program. Also deletes the data of this Attribute for the Registrations in this Program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'programRegistrationAttributeId',
    required: true,
    type: 'integer',
  })
  @Delete(':programId/registration-attributes/:programRegistrationAttributeId')
  public async deleteProgramRegistrationAttribute(
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
    name: 'filterShowInRegistrationsTable',
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
      'filterShowInRegistrationsTable',
      new ParseBoolPipe({ optional: true }),
    )
    filterShowInRegistrationsTable: boolean,
    @Req() req: ScopedUserRequest,
  ): Promise<Attribute[]> {
    const userId = RequestHelper.getUserId(req);

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
    const attr = await this.programAttributesService.getAttributes({
      programId,
      includeProgramRegistrationAttributes,
      includeTemplateDefaultAttributes,
      filterShowInRegistrationsTable,
    });
    return attr;
  }

  // TODO: REFACTOR: This endpoint's return is not typed as a DTO, so it is not clear what the response structure is in Swagger UI. See guidelines.
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Get information about the funding wallet' })
  @Get(':programId/fsps/intersolve-visa/funding-wallet')
  public async getFundingWallet(
    @Param('programId', ParseIntPipe)
    programId: number,
  ) {
    return await this.programService.getFundingWallet(programId);
  }
}
