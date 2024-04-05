import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../guards/admin.guard';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionEnum } from '../user/enum/permission.enum';
import { User } from '../user/user.decorator';
import { CreateNoteDto } from './dto/note.dto';
import { ResponseNoteDto } from './dto/response-note.dto';
import { NoteService } from './notes.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('programs')
@Controller('programs')
export class NoteController {
  private readonly noteService: NoteService;
  public constructor(noteService: NoteService) {
    this.noteService = noteService;
  }

  @Permissions(PermissionEnum.RegistrationPersonalUPDATE)
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
  @Post(':programId/notes')
  public async createNote(
    @User('id') userId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() createNote: CreateNoteDto,
  ): Promise<void> {
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

  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ summary: '[SCOPED] Get notes for registration' })
  @ApiResponse({
    status: HttpStatus.OK,
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
