import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachement.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class ProgramAttachmentScopedRepository extends ScopedRepository<ProgramAttachmentEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(ProgramAttachmentEntity)
    repository: Repository<ProgramAttachmentEntity>,
  ) {
    super(request, repository);
  }
}
