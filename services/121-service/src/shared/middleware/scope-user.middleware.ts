import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { ProgramAidworkerAssignmentEntity } from '../../programs/program-aidworker.entity';
import { getUserIdFromRequest } from '../../user/user.helper';

export interface ScopedUserRequest extends Request {
  scope?: string;
  userId?: number;
}

export interface ScopedUserInterface {
  scope?: string;
  userId?: number;
}

@Injectable()
export class ScopeUserMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ProgramAidworkerAssignmentEntity)
    private assignmentRepo: Repository<ProgramAidworkerAssignmentEntity>, // Inject your repository
  ) {}
  async use(req: ScopedUserRequest, res: Response, next: any): Promise<void> {
    const match = req.path.match(/\/programs\/(\d+)/);
    let programId: number;
    if (match) {
      programId = Number(match[1]);
    } else {
      throw new Error('Endpoint is missing programId parameter');
    }
    // Extract scope from assignment and store in request.scope
    const userId = getUserIdFromRequest('id', req);
    req.userId = userId;
    const assignment = await this.assignmentRepo.findOne({
      where: { userId: userId, programId: programId },
    });
    const scope = assignment?.scope ? assignment.scope : '';
    req.scope = scope;
    next();
  }
}
