import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { ScopedRepository } from '../scoped.repository';
import { NoteEntity } from './note.entity';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class NoteScopedRepository extends ScopedRepository<NoteEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public request: Request,
  ) {
    super(NoteEntity, dataSource);
  }
}
