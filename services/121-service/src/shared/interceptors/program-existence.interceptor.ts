import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Equal } from 'typeorm';

import { AuthenticatedUserParameters } from '@121-service/src/guards/authenticated-user.decorator';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';

//
@Injectable()
export class ProgramExistenceInterceptor implements NestInterceptor {
  constructor(
    private readonly programRepository: ProgramRepository,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    if (!request.params.programId) {
      return next.handle();
    }
    const programId = request.params.programId;
    const handler = context.getHandler();
    const classRef = context.getClass();
    const authParams =
      this.reflector.get<AuthenticatedUserParameters>(
        'authenticationParameters',
        handler,
      ) ||
      this.reflector.get<AuthenticatedUserParameters>(
        'authenticationParameters',
        classRef,
      );

    // This check makes used of the AuthenticatedUserParameters decorator to determine if an endpoint requires a user to be an admin or organization admin
    // If the user is an admin or organization admin check if the programId exists
    // This is not needed for regular users as they can only access their own programs
    if (authParams?.isAdmin || authParams?.isOrganizationAdmin) {
      await this.validateProgramExists(programId);
    }

    return next.handle();
  }

  public async validateProgramExists(programId: number): Promise<void> {
    const programCount = await this.programRepository.count({
      where: { id: Equal(programId) },
    });
    if (programCount === 0) {
      throw new HttpException(
        `Program with id ${programId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
