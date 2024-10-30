import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateNoteDto } from '@121-service/src/notes/dto/note.dto';
import { ResponseNoteDto } from '@121-service/src/notes/dto/response-note.dto';
import { NotesService } from '@121-service/src/notes/notes.service';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
@Controller('programs')
export class NoteController {
  private readonly notesService: NotesService;
  public constructor(notesService: NotesService) {
    this.notesService = notesService;
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationPersonalUPDATE],
  })
  @ApiOperation({ summary: '[SCOPED] Create note for registration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Created new note for registration - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'ReferenceId is not known - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @Post(':programId/registrations/:referenceId/notes')
  public async createNote(
    @Req() req: ScopedUserRequest,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
    @Body() createNote: CreateNoteDto,
  ): Promise<void> {
    // TODO: REFACTOR: Should return a representation of the created note in the response
    const userId = RequestHelper.getUserId(req);

    await this.notesService.createNote(
      referenceId,
      createNote.text,
      userId,
      programId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationPersonalREAD] })
  @ApiOperation({ summary: '[SCOPED] Get notes for registration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Retrieved notes for registration - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: [ResponseNoteDto],
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @Get(':programId/registrations/:referenceId/notes')
  public async retrieveNotes(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
  ): Promise<ResponseNoteDto[]> {
    // TODO: REFACTOR: Should return the user as a nested object in the response, see e.g.: GET /api/programs/{programId}/actions
    return await this.notesService.retrieveNotes(referenceId, programId);
  }
}
