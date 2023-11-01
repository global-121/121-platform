import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { ProgramAidworkerAssignmentEntity } from '../../programs/program-aidworker.entity';
import { UserToken } from '../../user/user.interface';
import { CookieNames } from '../enum/cookie.enums';
import { InterfaceNames } from '../enum/interface-names.enum';

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

    const userId = this.getUserId(req);
    console.log('userId: ', userId);
    const assignment = await this.assignmentRepo.findOne({
      where: { userId: userId, programId: Number(req.params.programId) },
    });

    console.log('assignment: ', assignment);
    // Extract scope from request and store in request.scope
    req.scope = assignment.scope;
    next();
  }

  // TODO this is a copy of the code in the user decorator. This should be reused
  private getUserId(req: Request): number {
    console.log('getUserId: ');
    // in case a route is not protected, we still want to get the optional auth user from jwt
    const headerKey = 'x-121-interface';
    const originInterface = req.headers[headerKey];
    let token;
    if (req.cookies) {
      if (
        originInterface === InterfaceNames.portal &&
        req.cookies[CookieNames.portal]
      ) {
        token = req.cookies[CookieNames.portal];
      } else if (
        originInterface === InterfaceNames.awApp &&
        req.cookies[CookieNames.awApp]
      ) {
        token = req.cookies[CookieNames.awApp];
      } else if (
        originInterface === InterfaceNames.paApp &&
        req.cookies[CookieNames.paApp]
      ) {
        token = req.cookies[CookieNames.paApp];
      } else if (!originInterface && req.cookies[CookieNames.general]) {
        token = req.cookies[CookieNames.general];
      } else {
        token = null;
      }
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.SECRETS_121_SERVICE_SECRET,
      ) as UserToken;
      return decoded['id'];
    }
  }
}
