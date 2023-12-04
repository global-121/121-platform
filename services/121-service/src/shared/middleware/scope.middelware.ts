import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramAidworkerAssignmentEntity } from '../../programs/program-aidworker.entity';
import { getUserIdFromRequest } from '../../user/user.helper';

// Extend Express Request interface to add a 'scope' property
declare module 'express' {
  export interface Request {
    scope?: string;
  }
}

@Injectable()
export class ScopeMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ProgramAidworkerAssignmentEntity)
    private assignmentRepo: Repository<ProgramAidworkerAssignmentEntity>, // Inject your repository
  ) {}
  async use(req: Request, res: Response, next: any): Promise<void> {
    const programId = Number(req.params.programId);

    if (!programId) {
      throw new Error('Endpoint is missing programId parameter');
    }

    const userId = getUserIdFromRequest('id', req);
    const assignment = await this.assignmentRepo.findOne({
      where: { userId: userId, programId: Number(req.params.programId) },
    });

    // Extract scope from request and store in request.scope
    req.scope = assignment.scope ? assignment.scope : '';
    next();
  }
}
