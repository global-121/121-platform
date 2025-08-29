import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { NoteEntity } from '@121-service/src/notes/note.entity';
import { NoteScopedRepository } from '@121-service/src/notes/note.repository';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

@Injectable()
export class NotesService {
  public constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly noteScopedRepository: NoteScopedRepository,
  ) {}

  public async createNote(
    // TODO: REFACTOR: Should be an object as there are 4 parameters
    referenceId: string,
    text: string,
    userId: number,
    programId: number,
  ): Promise<void> {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        relations: undefined,
        programId,
      },
    );

    if (!registration) {
      const errors = `ReferenceId ${referenceId} is not known.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const note = new NoteEntity();
    note.registrationId = registration.id;
    note.userId = userId;
    note.text = text;

    await this.noteScopedRepository.save(note);
  }
}
