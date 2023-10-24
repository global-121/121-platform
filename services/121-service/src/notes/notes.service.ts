import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationsService } from '../registration/registrations.service';
import { ResponseNoteDto } from './dto/response-note.dto';
import { NoteEntity } from './note.entity';

@Injectable()
export class NoteService {
  @InjectRepository(NoteEntity)
  private noteRepository: Repository<NoteEntity>;

  public constructor(
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async createNote(
    referenceId: string,
    text: string,
    userId: number,
  ): Promise<void> {
    const registration =
      await this.registrationsService.getRegistrationFromReferenceId(
        referenceId,
      );

    if (!registration) {
      const errors = `ReferenceId ${referenceId} is not known.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const note = {
      registrationId: registration.id,
      userId,
      text,
    };

    await this.noteRepository.save(note);
  }

  public async retrieveNote(
    referenceId: string,
    programId: number,
  ): Promise<ResponseNoteDto[]> {
    const notes = await this.noteRepository
      .createQueryBuilder('note')
      .innerJoin('note.registration', 'registration')
      .innerJoinAndSelect('note.user', 'user')
      .where('registration.referenceId = :referenceId', { referenceId })
      .andWhere('registration.programId = :programId', { programId })
      .select([
        'note.id as id',
        'note.text as text',
        'note.registrationId as registrationId',
        'note.userId as userId',
        'note.created as created',
        'user.username AS username',
      ])
      .orderBy('note.created', 'DESC')
      .getRawMany();

    return notes;
  }
}
