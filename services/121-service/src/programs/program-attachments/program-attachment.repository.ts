import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';

export class ProgramAttachmentRepository extends Repository<ProgramAttachmentEntity> {
  constructor(
    @InjectRepository(ProgramAttachmentEntity)
    private readonly repository: Repository<ProgramAttachmentEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
