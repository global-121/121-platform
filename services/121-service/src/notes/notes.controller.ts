import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../guards/admin.guard';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionEnum } from '../user/permission.enum';
import { User } from '../user/user.decorator';
import { CreateNoteDto } from './dto/note.dto';
import { NoteEntity } from './note.entity';
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
  @ApiOperation({ summary: 'Create note for registration' })
  @ApiResponse({ status: 201, description: 'Create note for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(':programId/note')
  public async createNote(
    @User('id') userId: number,
    @Body() createNote: CreateNoteDto,
  ): Promise<NoteEntity> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    return await this.noteService.createNote(
      createNote.referenceId,
      createNote.text,
      userId,
    );
  }

  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ summary: 'Get note for registration' })
  @ApiResponse({ status: 200, description: 'Get note for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true })
  @Get(':programId/note/:referenceId')
  public async retrieveNote(@Param() params): Promise<NoteEntity[]> {
    return await this.noteService.retrieveNote(
      params.referenceId,
      params.programId,
    );
  }
}
