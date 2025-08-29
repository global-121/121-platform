import {
  Body,
  Controller,
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
import { CreateNoteDto } from '@121-service/src/notes/dto/create-note.dto';
import { NotesService } from '@121-service/src/notes/notes.service';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('projects')
@Controller('projects')
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
      'Created new note for registration - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'ReferenceId is not known - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @Post(':projectId/registrations/:referenceId/notes')
  public async createNote(
    @Req() req: ScopedUserRequest,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('referenceId') referenceId: string,
    @Body() createNote: CreateNoteDto,
  ): Promise<void> {
    // TODO: REFACTOR: Should return a representation of the created note in the response
    const userId = RequestHelper.getUserId(req);

    await this.notesService.createNote(
      referenceId,
      createNote.text,
      userId,
      projectId,
    );
  }
}
