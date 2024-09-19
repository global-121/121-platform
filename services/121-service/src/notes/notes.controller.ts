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
import { NoteService } from '@121-service/src/notes/notes.service';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
@Controller('programs')
export class NoteController {
  private readonly noteService: NoteService;
  public constructor(noteService: NoteService) {
    this.noteService = noteService;
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
    status: HttpStatus.UNAUTHORIZED,
    description: 'No user detectable from cookie or no cookie present',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'ReferenceId is not known - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @Post(':programId/registrations/:referenceId/note')
  public async createNote(
    @Req() req: ScopedUserRequest,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
    @Body() createNote: CreateNoteDto,
  ): Promise<void> {
    const userId = RequestHelper.getUserId(req);

    await this.noteService.createNote(
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
    return await this.noteService.retrieveNotes(referenceId, programId);
  }
}
