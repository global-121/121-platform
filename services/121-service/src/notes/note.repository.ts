import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';

import { GetNotesDto } from '@121-service/src/notes/dto/get-notes.dto';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class NoteScopedRepository extends ScopedRepository<NoteEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(NoteEntity)
    scopedRepository: ScopedRepository<NoteEntity>,
  ) {
    super(request, scopedRepository);
  }

  async getManyByRegistrationIdAndProgramId(
    registrationId: number,
    programId: number,
  ) {
    return await this.createQueryBuilder('note')
      .innerJoin('note.registration', 'registration')
      .innerJoinAndSelect('note.user', 'user')
      .andWhere('registration.id = :registrationId', { registrationId })
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
      .getRawMany<GetNotesDto>(); // ##TODO: Why not just return TwilioMessageEntity[]? And is this an example where we want to try a "normal" TypeORM query instead of a raw query?
  }
}
