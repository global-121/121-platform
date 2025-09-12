import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { NoteEntity } from '@121-service/src/notes/note.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

export class NoteScopedRepository extends ScopedRepository<NoteEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(NoteEntity)
    repository: Repository<NoteEntity>,
  ) {
    super(request, repository);
  }

  async getManyByRegistrationIdAndProgramId(
    registrationId: number,
    programId: number,
  ) {
    const result: (NoteEntity & { user: UserEntity })[] = await this.find({
      where: {
        registration: {
          id: Equal(registrationId),
          programId: Equal(programId),
        },
      },
      relations: ['user'],
      order: { created: 'DESC' },
    });
    return result;
  }
}
