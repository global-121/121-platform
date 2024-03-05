import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../guards/authenticated-user.guard';
import { PermissionEnum } from '../user/enum/permission.enum';
import { CreateNoteDto } from './dto/note.dto';
import { ResponseNoteDto } from './dto/response-note.dto';
import { NoteService } from './notes.service';

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
    status: 201,
    description:
      'Created new note for registration - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  @ApiResponse({
    status: 404,
    description:
      'ReferenceId is not known - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/notes')
  public async createNote(
    @Req() req,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() createNote: CreateNoteDto,
  ): Promise<void> {
    const userId = req.user.id;
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    await this.noteService.createNote(
      createNote.referenceId,
      createNote.text,
      userId,
      programId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationPersonalREAD] })
  @ApiOperation({ summary: '[SCOPED] Get notes for registration' })
  @ApiResponse({
    status: 200,
    description:
      'Retrieved notes for registration - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: [ResponseNoteDto],
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true })
  @Get(':programId/notes/:referenceId')
  public async retrieveNotes(@Param() params): Promise<ResponseNoteDto[]> {
    return await this.noteService.retrieveNotes(
      params.referenceId,
      params.programId,
    );
  }
}
