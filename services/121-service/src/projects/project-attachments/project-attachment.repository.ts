import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectAttachmentEntity } from '@121-service/src/projects/project-attachments/project-attachment.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class ProjectAttachmentScopedRepository extends ScopedRepository<ProjectAttachmentEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(ProjectAttachmentEntity)
    repository: Repository<ProjectAttachmentEntity>,
  ) {
    super(request, repository);
  }
}
