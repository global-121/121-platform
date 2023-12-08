import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { RegistrationsService } from '../registration/registrations.service';
import { ResponseNoteDto } from './dto/response-note.dto';
import { ScopedRepository } from '../scoped.repository';
import { NoteEntity } from './note.entity';
import { getScopedRepositoryProvideName } from '../utils/scope/createScopedRepositoryProvider.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class NoteService {
  @InjectRepository(NoteEntity)
  private readonly noteRepository: Repository<NoteEntity>;

  public constructor(
    private readonly registrationsService: RegistrationsService,
    @Inject(getScopedRepositoryProvideName(NoteEntity))
    private noteScopedRepository: ScopedRepository<NoteEntity>,
  ) {}

  public async createNote(
    referenceId: string,
    text: string,
    userId: number,
    programId: number,
  ): Promise<void> {
    const registration =
      await this.registrationsService.getRegistrationFromReferenceId(
        referenceId,
        null,
        programId,
      );

    if (!registration) {
      const errors = `ReferenceId ${referenceId} is not known.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const note = {
      registrationId: registration.id,
      userId,
      text,
      scope: registration.scope,
    };

    await this.noteRepository.save(note);
  }

  public async retrieveNotes(
    referenceId: string,
    programId: number,
  ): Promise<ResponseNoteDto[]> {
    const qb = this.noteScopedRepository
      .createQueryBuilder('note')
      .innerJoin('note.registration', 'registration')
      .innerJoinAndSelect('note.user', 'user')
      .andWhere('registration.referenceId = :referenceId', { referenceId })
      .andWhere('registration.programId = :programId', { programId })
      .select([
        'note.id as id',
        'note.text as text',
        'note.registrationId as registrationId',
        'note.userId as userId',
        'note.created as created',
        'user.username AS username',
      ])
      .orderBy('note.created', 'DESC');
    const notes = await qb.getRawMany();
    return notes;
  }
}
