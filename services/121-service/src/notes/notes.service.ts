import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RegistrationRepository } from '../registration/registration.repository';
import { RegistrationsService } from '../registration/registrations.service';
import { ResponseNoteDto } from './dto/response-note.dto';
import { NoteRepository } from './notes.repository';

@Injectable()
export class NoteService {
  // @InjectRepository(NoteEntity)
  // private noteRepository: Repository<NoteEntity>;

  public constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly noteRepository: NoteRepository,
    private readonly registrationsRepo: RegistrationRepository,
  ) {}

  public async createNote(
    referenceId: string,
    text: string,
    userId: number,
  ): Promise<void> {
    // const registration =
    //   await this.registrationsService.getRegistrationFromReferenceId(
    //     referenceId,
    //   );

    // This should only return registrations for which this User has the correct scope
    const registrations = await this.registrationsRepo.find({
      where: { referenceId },
    });

    const registration = registrations[0];

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
