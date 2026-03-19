import { Injectable } from '@nestjs/common';

import { NoteEntity } from '@121-service/src/notes/note.entity';
import { NoteScopedRepository } from '@121-service/src/notes/note.repository';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

@Injectable()
export class NotesService {
  public constructor(
    private readonly noteScopedRepository: NoteScopedRepository,
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async createNote(
    // TODO: REFACTOR: Should be an object as there are 4 parameters
    registrationId: number,
    text: string,
    userId: number,
    programId: number,
  ): Promise<void> {
    const registration =
      await this.registrationsService.getRegistrationByIdOrThrow({
        registrationId,
        relations: undefined,
        programId,
      });

    const note = new NoteEntity();
    note.registrationId = registration.id;
    note.userId = userId;
    note.text = text;

    await this.noteScopedRepository.save(note);
  }
}
