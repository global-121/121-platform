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
import { ProjectRepository } from '@121-service/src/projects/repositories/project.repository';

//
@Injectable()
export class ProjectExistenceInterceptor implements NestInterceptor {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    if (!request.params.projectId) {
      return next.handle();
    }
    const projectId = request.params.projectId;
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

    // This check makes used of the AuthenticatedUserParameters decorator to determine if an endpoint regquires a user to be an admin or organization admin
    // If the user is an admin or organization admin check if the projectId exists
    // This is not needed for regular users as they can only access their own projects
    if (authParams?.isAdmin || authParams?.isOrganizationAdmin) {
      await this.validateProjectExists(projectId);
    }

    return next.handle();
  }

  public async validateProjectExists(projectId: number): Promise<void> {
    const projectCount = await this.projectRepository.count({
      where: { id: Equal(projectId) },
    });
    if (projectCount === 0) {
      throw new HttpException(
        `Project with id ${projectId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
